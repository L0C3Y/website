const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet"); // Security middleware
const cors = require("cors");
const { body, validationResult, param, query } = require("express-validator");
const router = express.Router();

// Security middleware
router.use(helmet());
router.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Enhanced rate limiting with different tiers
const createOrderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  message: { success: false, error: "Too many order creation attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const verifyPaymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { success: false, error: "Too many verification attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Razorpay instance with better error handling
let razorpay;
try {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
} catch (error) {
  console.error('Failed to initialize Razorpay:', error);
  process.exit(1);
}

// Enhanced MongoDB Schemas with additional validation
const affiliateSchema = new mongoose.Schema({
  affiliateId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true // Add index for better query performance
  },
  name: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 100
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  phone: { 
    type: String,
    match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number']
  },
  commissionRate: { 
    type: Number, 
    default: 10, 
    min: [0, 'Commission rate cannot be negative'], 
    max: [100, 'Commission rate cannot exceed 100%']
  },
  totalEarnings: { 
    type: Number, 
    default: 0,
    min: [0, 'Total earnings cannot be negative']
  },
  totalSales: { 
    type: Number, 
    default: 0,
    min: [0, 'Total sales cannot be negative']
  },
  isActive: { type: Boolean, default: true },
  bankDetails: {
    accountNumber: { 
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^\d{9,18}$/.test(v.replace(/\s/g, ''));
        },
        message: 'Please enter a valid account number'
      }
    },
    ifscCode: { 
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^[A-Z]{4}0[A-Z0-9]{6}$/.test(v);
        },
        message: 'Please enter a valid IFSC code'
      }
    },
    accountHolderName: { 
      type: String,
      trim: true,
      maxlength: 100
    },
    bankName: { 
      type: String,
      trim: true,
      maxlength: 100
    }
  },
  // New fields for better tracking
  referralCode: { 
    type: String, 
    unique: true, 
    sparse: true 
  },
  tier: { 
    type: String, 
    enum: ['bronze', 'silver', 'gold', 'platinum'], 
    default: 'bronze' 
  },
  lastLoginAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true // Automatically handle createdAt and updatedAt
});

const orderSchema = new mongoose.Schema({
  orderId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true
  },
  razorpayOrderId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true
  },
  amount: { 
    type: Number, 
    required: true,
    min: [100, 'Minimum amount is 1 INR (100 paise)']
  },
  currency: { type: String, default: "INR" },
  status: {
    type: String,
    enum: ["created", "attempted", "paid", "failed", "cancelled", "refunded"],
    default: "created",
    index: true // Index for faster status queries
  },
  affiliateId: { 
    type: String, 
    ref: "Affiliate",
    index: true // Index for affiliate queries
  },
  affiliateCommission: { 
    type: Number, 
    default: 0,
    min: [0, 'Commission cannot be negative']
  },
  customerDetails: {
    name: { 
      type: String,
      trim: true,
      maxlength: 100
    },
    email: { 
      type: String,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    phone: { 
      type: String,
      match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number']
    },
    address: { 
      type: String,
      trim: true,
      maxlength: 500
    }
  },
  productDetails: {
    productId: String,
    productName: { 
      type: String,
      trim: true,
      maxlength: 200
    },
    quantity: { 
      type: Number, 
      default: 1,
      min: [1, 'Quantity must be at least 1']
    },
    price: { 
      type: Number,
      min: [0, 'Price cannot be negative']
    }
  },
  // Enhanced tracking fields
  referrerUrl: String,
  userAgent: String,
  ipAddress: String,
  utmSource: String,
  utmMedium: String,
  utmCampaign: String,
  utmTerm: String,
  utmContent: String,
  // New fields for better analytics
  deviceType: String,
  browserName: String,
  osName: String,
  country: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

const paymentSchema = new mongoose.Schema({
  paymentId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true
  },
  razorpayPaymentId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true
  },
  orderId: { 
    type: String, 
    required: true, 
    ref: "Order",
    index: true
  },
  razorpayOrderId: { 
    type: String, 
    required: true,
    index: true
  },
  amount: { 
    type: Number, 
    required: true,
    min: [0, 'Amount cannot be negative']
  },
  currency: { type: String, default: "INR" },
  status: {
    type: String,
    enum: ["captured", "authorized", "failed", "refunded", "partial_refunded"],
    default: "captured",
    index: true
  },
  method: String,
  paymentDetails: {
    cardId: String,
    cardNetwork: String,
    cardType: String,
    bank: String,
    wallet: String,
    vpa: String,
    // Additional payment details
    cardLast4: String,
    cardIssuer: String,
    emiDuration: Number
  },
  signature: { type: String, required: true },
  affiliateId: { 
    type: String, 
    ref: "Affiliate",
    index: true
  },
  commissionPaid: { type: Boolean, default: false },
  // New fields for better tracking
  fee: Number, // Payment gateway fee
  tax: Number, // Tax amount
  settledAt: Date, // When the payment was settled
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

const commissionSchema = new mongoose.Schema({
  commissionId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true
  },
  affiliateId: { 
    type: String, 
    required: true, 
    ref: "Affiliate",
    index: true
  },
  orderId: { 
    type: String, 
    required: true, 
    ref: "Order",
    index: true
  },
  paymentId: { 
    type: String, 
    required: true, 
    ref: "Payment",
    index: true
  },
  amount: { 
    type: Number, 
    required: true,
    min: [0, 'Commission amount cannot be negative']
  },
  commissionRate: { 
    type: Number, 
    required: true,
    min: [0, 'Commission rate cannot be negative'],
    max: [100, 'Commission rate cannot exceed 100%']
  },
  status: {
    type: String,
    enum: ["pending", "approved", "paid", "cancelled", "hold"],
    default: "pending",
    index: true
  },
  paidAt: Date,
  paymentMethod: String,
  paymentReference: String,
  // New fields
  approvedAt: Date,
  approvedBy: String, // Admin who approved
  holdReason: String, // Reason for hold status
  notes: String, // Additional notes
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Add compound indexes for better query performance
orderSchema.index({ affiliateId: 1, status: 1, createdAt: -1 });
paymentSchema.index({ affiliateId: 1, status: 1, createdAt: -1 });
commissionSchema.index({ affiliateId: 1, status: 1, createdAt: -1 });

// Models
const Affiliate = mongoose.model("Affiliate", affiliateSchema);
const Order = mongoose.model("Order", orderSchema);
const Payment = mongoose.model("Payment", paymentSchema);
const Commission = mongoose.model("Commission", commissionSchema);

// Enhanced utility functions
const generateUniqueId = (prefix = "") => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `${prefix}${timestamp}_${random}`;
};

const generateReferralCode = () => {
  return Math.random().toString(36).substr(2, 8).toUpperCase();
};

// Enhanced logging with different levels
const logger = {
  info: (action, data) => {
    console.log(JSON.stringify({
      level: 'INFO',
      timestamp: new Date().toISOString(),
      action,
      data
    }, null, 2));
  },
  error: (action, data, error) => {
    console.error(JSON.stringify({
      level: 'ERROR',
      timestamp: new Date().toISOString(),
      action,
      data,
      error: {
        message: error?.message,
        stack: error?.stack
      }
    }, null, 2));
  },
  warn: (action, data) => {
    console.warn(JSON.stringify({
      level: 'WARN',
      timestamp: new Date().toISOString(),
      action,
      data
    }, null, 2));
  }
};

// Enhanced middleware
const extractAffiliateInfo = (req, res, next) => {
  const affiliateId = req.query.ref || req.body.affiliateId || req.headers['x-affiliate-id'];
  const utmSource = req.query.utm_source;
  const utmMedium = req.query.utm_medium;
  const utmCampaign = req.query.utm_campaign;
  const utmTerm = req.query.utm_term;
  const utmContent = req.query.utm_content;
  
  // Extract device info from user agent
  const userAgent = req.get('User-Agent') || '';
  let deviceType = 'unknown';
  let browserName = 'unknown';
  let osName = 'unknown';
  
  if (userAgent) {
    // Simple device detection
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      deviceType = 'mobile';
    } else if (/Tablet/.test(userAgent)) {
      deviceType = 'tablet';
    } else {
      deviceType = 'desktop';
    }
    
    // Simple browser detection
    if (userAgent.includes('Chrome')) browserName = 'chrome';
    else if (userAgent.includes('Firefox')) browserName = 'firefox';
    else if (userAgent.includes('Safari')) browserName = 'safari';
    else if (userAgent.includes('Edge')) browserName = 'edge';
    
    // Simple OS detection
    if (userAgent.includes('Windows')) osName = 'windows';
    else if (userAgent.includes('Mac')) osName = 'macos';
    else if (userAgent.includes('Linux')) osName = 'linux';
    else if (userAgent.includes('Android')) osName = 'android';
    else if (userAgent.includes('iOS')) osName = 'ios';
  }
  
  req.affiliateInfo = {
    affiliateId,
    utmSource,
    utmMedium,
    utmCampaign,
    utmTerm,
    utmContent,
    referrerUrl: req.get('Referer'),
    userAgent,
    ipAddress: req.ip || req.connection.remoteAddress,
    deviceType,
    browserName,
    osName
  };
  
  next();
};

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// JWT authentication middleware (optional)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token && process.env.REQUIRE_AUTH === 'true') {
    return res.status(401).json({
      success: false,
      error: 'Access token required'
    });
  }

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({
          success: false,
          error: 'Invalid or expired token'
        });
      }
      req.user = user;
    });
  }
  
  next();
};

// 🚀 ENHANCED AFFILIATE MANAGEMENT ROUTES

// Create new affiliate with validation
router.post("/affiliates", [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2-100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('phone')
    .optional()
    .matches(/^\+?[\d\s-()]+$/)
    .withMessage('Please provide a valid phone number'),
  body('commissionRate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Commission rate must be between 0-100'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { name, email, phone, commissionRate, bankDetails } = req.body;

    // Check if email already exists
    const existingAffiliate = await Affiliate.findOne({ email });
    if (existingAffiliate) {
      return res.status(400).json({
        success: false,
        error: "Email already registered"
      });
    }

    const affiliateId = generateUniqueId("AFF_");
    const referralCode = generateReferralCode();

    const affiliate = new Affiliate({
      affiliateId,
      referralCode,
      name,
      email,
      phone,
      commissionRate: commissionRate || 10,
      bankDetails
    });

    await affiliate.save();

    logger.info("AFFILIATE_CREATED", { affiliateId, email });

    res.status(201).json({
      success: true,
      affiliate: {
        affiliateId: affiliate.affiliateId,
        referralCode: affiliate.referralCode,
        name: affiliate.name,
        email: affiliate.email,
        commissionRate: affiliate.commissionRate,
        referralLink: `${process.env.FRONTEND_URL}?ref=${affiliate.affiliateId}`,
        shortReferralLink: `${process.env.FRONTEND_URL}?code=${affiliate.referralCode}`
      }
    });
  } catch (err) {
    logger.error("AFFILIATE_CREATION_FAILED", req.body, err);
    
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({
        success: false,
        error: `${field} already exists`
      });
    }
    
    res.status(500).json({
      success: false,
      error: "Failed to create affiliate"
    });
  }
});

// Get affiliate details with enhanced analytics
router.get("/affiliates/:affiliateId", [
  param('affiliateId').notEmpty().withMessage('Affiliate ID is required'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { affiliateId } = req.params;
    
    const affiliate = await Affiliate.findOne({ 
      $or: [
        { affiliateId },
        { referralCode: affiliateId }
      ]
    });

    if (!affiliate) {
      return res.status(404).json({
        success: false,
        error: "Affiliate not found"
      });
    }

    // Enhanced analytics with time-based data
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get comprehensive statistics
    const [
      totalOrders,
      totalRevenue,
      pendingCommissions,
      lastMonthStats,
      lastWeekStats,
      topProducts
    ] = await Promise.all([
      Order.countDocuments({ affiliateId: affiliate.affiliateId }),
      
      Payment.aggregate([
        { $match: { affiliateId: affiliate.affiliateId, status: "captured" } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      
      Commission.aggregate([
        { $match: { affiliateId: affiliate.affiliateId, status: "pending" } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      
      Order.aggregate([
        { 
          $match: { 
            affiliateId: affiliate.affiliateId, 
            createdAt: { $gte: lastMonth }
          }
        },
        { 
          $group: { 
            _id: null, 
            orders: { $sum: 1 },
            revenue: { $sum: "$amount" }
          }
        }
      ]),
      
      Order.aggregate([
        { 
          $match: { 
            affiliateId: affiliate.affiliateId, 
            createdAt: { $gte: lastWeek }
          }
        },
        { 
          $group: { 
            _id: null, 
            orders: { $sum: 1 },
            revenue: { $sum: "$amount" }
          }
        }
      ]),
      
      Order.aggregate([
        { $match: { affiliateId: affiliate.affiliateId } },
        { $group: { 
          _id: "$productDetails.productName", 
          count: { $sum: 1 },
          revenue: { $sum: "$amount" }
        }},
        { $sort: { revenue: -1 } },
        { $limit: 5 }
      ])
    ]);

    const affiliateData = affiliate.toObject();
    delete affiliateData.bankDetails; // Hide sensitive info

    res.json({
      success: true,
      affiliate: {
        ...affiliateData,
        statistics: {
          totalOrders,
          totalRevenue: totalRevenue[0]?.total || 0,
          pendingCommissions: pendingCommissions[0]?.total || 0,
          lastMonth: lastMonthStats[0] || { orders: 0, revenue: 0 },
          lastWeek: lastWeekStats[0] || { orders: 0, revenue: 0 },
          topProducts
        }
      }
    });
  } catch (err) {
    logger.error("AFFILIATE_FETCH_FAILED", { affiliateId: req.params.affiliateId }, err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch affiliate details"
    });
  }
});

// 💰 ENHANCED PAYMENT ROUTES

// Create order with comprehensive validation
router.post("/orders", createOrderLimiter, extractAffiliateInfo, [
  body('amount')
    .isInt({ min: 100 })
    .withMessage('Amount must be a positive integer in paise (minimum 100)'),
  body('customerDetails.name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Customer name must be between 2-100 characters'),
  body('customerDetails.email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid customer email'),
  body('productDetails.productName')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Product name cannot exceed 200 characters'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { amount, customerDetails, productDetails } = req.body;

    // Verify affiliate if provided
    let affiliate = null;
    let affiliateCommission = 0;
    
    if (req.affiliateInfo.affiliateId) {
      affiliate = await Affiliate.findOne({
        $or: [
          { affiliateId: req.affiliateInfo.affiliateId },
          { referralCode: req.affiliateInfo.affiliateId }
        ],
        isActive: true
      });
      
      if (affiliate) {
        affiliateCommission = Math.round((amount * affiliate.commissionRate) / 100);
      }
    }

    const orderId = generateUniqueId("ORD_");
    const razorpayOptions = {
      amount: amount,
      currency: "INR",
      receipt: orderId,
      notes: {
        orderId,
        affiliateId: affiliate?.affiliateId || "direct",
        productId: productDetails?.productId || "unknown"
      }
    };

    const razorpayOrder = await razorpay.orders.create(razorpayOptions);

    // Save order to database with enhanced tracking
    const order = new Order({
      orderId,
      razorpayOrderId: razorpayOrder.id,
      amount,
      affiliateId: affiliate?.affiliateId,
      affiliateCommission,
      customerDetails,
      productDetails,
      ...req.affiliateInfo
    });

    await order.save();

    logger.info("ORDER_CREATED", {
      orderId,
      amount,
      affiliateId: affiliate?.affiliateId,
      deviceType: req.affiliateInfo.deviceType
    });

    res.status(201).json({
      success: true,
      order: {
        id: razorpayOrder.id,
        orderId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        affiliateId: affiliate?.affiliateId,
        affiliateCommission,
        key: process.env.RAZORPAY_KEY_ID // Include for frontend
      }
    });
  } catch (err) {
    logger.error("ORDER_CREATION_FAILED", req.body, err);
    
    if (err.error && err.error.code === 'BAD_REQUEST_ERROR') {
      return res.status(400).json({
        success: false,
        error: "Invalid payment parameters"
      });
    }
    
    res.status(500).json({
      success: false,
      error: "Failed to create order"
    });
  }
});

// Enhanced payment verification with comprehensive error handling
router.post("/verify", verifyPaymentLimiter, [
  body('razorpay_order_id')
    .notEmpty()
    .withMessage('Razorpay order ID is required'),
  body('razorpay_payment_id')
    .notEmpty()
    .withMessage('Razorpay payment ID is required'),
  body('razorpay_signature')
    .notEmpty()
    .withMessage('Razorpay signature is required'),
  handleValidationErrors
], async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      } = req.body;

      // Verify signature
      const sign = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSign = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(sign.toString())
        .digest("hex");

      if (razorpay_signature !== expectedSign) {
        logger.warn("PAYMENT_VERIFICATION_FAILED", {
          razorpay_order_id,
          razorpay_payment_id,
          reason: 'signature_mismatch'
        });
        
        return res.status(400).json({
          success: false,
          error: "Payment verification failed"
        });
      }

      // Get order details
      const order = await Order.findOne({ 
        razorpayOrderId: razorpay_order_id 
      }).session(session);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          error: "Order not found"
        });
      }

      // Check if payment already processed
      const existingPayment = await Payment.findOne({
        razorpayPaymentId: razorpay_payment_id
      }).session(session);
      
      if (existingPayment) {
        return res.status(409).json({
          success: false,
          error: "Payment already processed"
        });
      }

      // Get payment details from Razorpay
      const razorpayPayment = await razorpay.payments.fetch(razorpay_payment_id);
      
      if (razorpayPayment.status !== 'captured') {
        logger.warn("PAYMENT_NOT_CAPTURED", {
          razorpay_payment_id,
          status: razorpayPayment.status
        });
        
        return res.status(400).json({
          success: false,
          error: "Payment not captured"
        });
      }

      const paymentId = generateUniqueId("PAY_");

      // Save payment details
      const payment = new Payment({
        paymentId,
        razorpayPaymentId: razorpay_payment_id,
        orderId: order.orderId,
        razorpayOrderId: razorpay_order_id,
        amount: razorpayPayment.amount,
        currency: razorpayPayment.currency,
        status: razorpayPayment.status,
        method: razorpayPayment.method,
        paymentDetails: {
          cardId: razorpayPayment.card_id,
          cardNetwork: razorpayPayment.card?.network,
          cardType: razorpayPayment.card?.type,
          cardLast4: razorpayPayment.card?.last4,
          cardIssuer: razorpayPayment.card?.issuer,
          bank: razorpayPayment.bank,
          wallet: razorpayPayment.wallet,
          vpa: razorpayPayment.vpa,
          emiDuration: razorpayPayment.emi?.duration
        },
        signature: razorpay_signature,
        affiliateId: order.affiliateId,
        fee: razorpayPayment.fee || 0,
        tax: razorpayPayment.tax || 0
      });

      await payment.save({ session });

      // Update order status
      order.status = "paid";
      await order.save({ session });

      // Process affiliate commission if applicable
      let commission = null;
      if (order.affiliateId && order.affiliateCommission > 0) {
        const commissionId = generateUniqueId("COM_");
        
        commission = new Commission({
          commissionId,
          affiliateId: order.affiliateId,
          orderId: order.orderId,
          paymentId: payment.paymentId,
          amount: order.affiliateCommission,
          commissionRate: (order.affiliateCommission / order.amount) * 100,
          status: 'pending'
        });

        await commission.save({ session });

        // Update affiliate totals
        await Affiliate.findOneAndUpdate(
          { affiliateId: order.affiliateId },
          {
            $inc: {
              totalEarnings: order.affiliateCommission,
              totalSales: order.amount
            },
            updatedAt: new Date()
          },
          { session }
        );

        logger.info("COMMISSION_CREATED", {
          commissionId,
          affiliateId: order.affiliateId,
          amount: order.affiliateCommission
        });
      }

      logger.info("PAYMENT_VERIFIED", {
        orderId: order.orderId,
        paymentId,
        amount: payment.amount,
        affiliateId: order.affiliateId,
        method: payment.method
      });

      res.json({
        success: true,
        message: "Payment verified successfully",
        payment: {
          orderId: order.orderId,
          paymentId,
          amount: payment.amount,
          status: payment.status,
          method: payment.method,
          commission: commission ? {
            commissionId: commission.commissionId,
            amount: commission.amount
          } : null
        }
      });
    });
  } catch (err) {
    logger.error("PAYMENT_VERIFICATION_ERROR", req.body, err);
    
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: "Invalid payment data",
        details: Object.values(err.errors).map(e => e.message)
      });
    }
    
    res.status(500).json({
      success: false,
      error: "Internal server error during verification"
    });
  } finally {
    session.endSession();
  }
});

// 📊 ENHANCED ANALYTICS & REPORTING ROUTES

// Get comprehensive payment analytics
router.get("/analytics/payments", authenticateToken, [
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format'),
  query('affiliateId').optional().notEmpty().withMessage('Affiliate ID cannot be empty'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { startDate, endDate, affiliateId, groupBy = 'day' } = req.query;
    
    let matchFilter = { status: "captured" };
    
    if (startDate || endDate) {
      matchFilter.createdAt = {};
      if (startDate) matchFilter.createdAt.$gte = new Date(startDate);
      if (endDate) matchFilter.createdAt.$lte = new Date(endDate);
    }
    
    if (affiliateId) {
      matchFilter.affiliateId = affiliateId;
    }

    // Get basic analytics
    const [basicAnalytics, paymentMethods, topAffiliates, timeSeriesData] = await Promise.all([
      Payment.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: null,
            totalPayments: { $sum: 1 },
            totalAmount: { $sum: "$amount" },
            avgAmount: { $avg: "$amount" },
            totalFee: { $sum: "$fee" },
            totalTax: { $sum: "$tax" }
          }
        }
      ]),
      
      // Payment methods breakdown
      Payment.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: "$method",
            count: { $sum: 1 },
            amount: { $sum: "$amount" }
          }
        },
        { $sort: { amount: -1 } }
      ]),
      
      // Top performing affiliates
      Payment.aggregate([
        { $match: { ...matchFilter, affiliateId: { $exists: true, $ne: null } } },
        {
          $group: {
            _id: "$affiliateId",
            totalSales: { $sum: "$amount" },
            totalOrders: { $sum: 1 },
            avgOrderValue: { $avg: "$amount" }
          }
        },
        { $sort: { totalSales: -1 } },
        { $limit: 10 }
      ]),
      
      // Time series data
      Payment.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: {
              $dateToString: {
                format: groupBy === 'hour' ? "%Y-%m-%d %H:00" : 
                       groupBy === 'week' ? "%Y-%U" : "%Y-%m-%d",
                date: "$createdAt"
              }
            },
            count: { $sum: 1 },
            amount: { $sum: "$amount" }
          }
        },
        { $sort: { "_id": 1 } }
      ])
    ]);

    // Device and browser analytics
    const deviceAnalytics = await Order.aggregate([
      { $match: { status: "paid" } },
      {
        $group: {
          _id: {
            deviceType: "$deviceType",
            browserName: "$browserName"
          },
          count: { $sum: 1 },
          totalValue: { $sum: "$amount" }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      analytics: {
        basic: basicAnalytics[0] || {
          totalPayments: 0,
          totalAmount: 0,
          avgAmount: 0,
          totalFee: 0,
          totalTax: 0
        },
        paymentMethods,
        topAffiliates,
        timeSeries: timeSeriesData,
        deviceAnalytics
      }
    });
  } catch (err) {
    logger.error("ANALYTICS_FETCH_FAILED", req.query, err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch analytics"
    });
  }
});

// Enhanced commission reports with filters
router.get("/commissions", authenticateToken, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1-100'),
  query('status').optional().isIn(['pending', 'approved', 'paid', 'cancelled', 'hold']).withMessage('Invalid status'),
  handleValidationErrors
], async (req, res) => {
  try {
    const {
      affiliateId,
      status = "all",
      page = 1,
      limit = 20,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    let matchFilter = {};
    
    if (affiliateId) {
      matchFilter.affiliateId = affiliateId;
    }
    
    if (status !== "all") {
      matchFilter.status = status;
    }
    
    if (startDate || endDate) {
      matchFilter.createdAt = {};
      if (startDate) matchFilter.createdAt.$gte = new Date(startDate);
      if (endDate) matchFilter.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;
    const sortDirection = sortOrder === 'desc' ? -1 : 1;

    const [commissions, total, summary] = await Promise.all([
      Commission.find(matchFilter)
        .populate({
          path: 'affiliateId',
          select: 'name email affiliateId'
        })
        .sort({ [sortBy]: sortDirection })
        .skip(skip)
        .limit(parseInt(limit)),
      
      Commission.countDocuments(matchFilter),
      
      Commission.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            amount: { $sum: "$amount" }
          }
        }
      ])
    ]);

    // Calculate summary totals
    const summaryTotals = summary.reduce((acc, item) => {
      acc.totalCount += item.count;
      acc.totalAmount += item.amount;
      return acc;
    }, { totalCount: 0, totalAmount: 0 });

    res.json({
      success: true,
      commissions,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: total,
        limit: parseInt(limit)
      },
      summary: {
        byStatus: summary,
        totals: summaryTotals
      }
    });
  } catch (err) {
    logger.error("COMMISSIONS_FETCH_FAILED", req.query, err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch commissions"
    });
  }
});

// Enhanced commission status update with audit trail
router.patch("/commissions/:commissionId", authenticateToken, [
  param('commissionId').notEmpty().withMessage('Commission ID is required'),
  body('status')
    .isIn(['pending', 'approved', 'paid', 'cancelled', 'hold'])
    .withMessage('Invalid status'),
  body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters'),
  handleValidationErrors
], async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      const { commissionId } = req.params;
      const { status, paymentMethod, paymentReference, notes, holdReason } = req.body;

      const updateData = {
        status,
        updatedAt: new Date(),
        notes
      };

      if (status === "paid") {
        updateData.paidAt = new Date();
        updateData.paymentMethod = paymentMethod;
        updateData.paymentReference = paymentReference;
      } else if (status === "approved") {
        updateData.approvedAt = new Date();
        updateData.approvedBy = req.user?.id || 'system';
      } else if (status === "hold") {
        updateData.holdReason = holdReason;
      }

      const commission = await Commission.findOneAndUpdate(
        { commissionId },
        updateData,
        { new: true, session }
      ).populate('affiliateId', 'name email affiliateId');

      if (!commission) {
        return res.status(404).json({
          success: false,
          error: "Commission not found"
        });
      }

      // Update payment record if commission is paid
      if (status === "paid") {
        await Payment.findOneAndUpdate(
          { paymentId: commission.paymentId },
          { commissionPaid: true },
          { session }
        );
      }

      logger.info("COMMISSION_UPDATED", {
        commissionId,
        status,
        affiliateId: commission.affiliateId?.affiliateId,
        updatedBy: req.user?.id || 'system'
      });

      res.json({
        success: true,
        message: `Commission ${status} successfully`,
        commission
      });
    });
  } catch (err) {
    logger.error("COMMISSION_UPDATE_FAILED", { ...req.body, commissionId: req.params.commissionId }, err);
    res.status(500).json({
      success: false,
      error: "Failed to update commission"
    });
  } finally {
    session.endSession();
  }
});

// Bulk commission operations
router.post("/commissions/bulk", authenticateToken, [
  body('action')
    .isIn(['approve', 'pay', 'cancel'])
    .withMessage('Invalid bulk action'),
  body('commissionIds')
    .isArray({ min: 1 })
    .withMessage('Commission IDs array is required'),
  body('paymentMethod')
    .optional()
    .notEmpty()
    .withMessage('Payment method is required for pay action'),
  handleValidationErrors
], async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      const { action, commissionIds, paymentMethod, paymentReference } = req.body;

      let updateData = { updatedAt: new Date() };
      
      switch (action) {
        case 'approve':
          updateData.status = 'approved';
          updateData.approvedAt = new Date();
          updateData.approvedBy = req.user?.id || 'system';
          break;
        case 'pay':
          updateData.status = 'paid';
          updateData.paidAt = new Date();
          updateData.paymentMethod = paymentMethod;
          updateData.paymentReference = paymentReference;
          break;
        case 'cancel':
          updateData.status = 'cancelled';
          break;
      }

      const result = await Commission.updateMany(
        { commissionId: { $in: commissionIds } },
        updateData,
        { session }
      );

      logger.info("BULK_COMMISSION_UPDATE", {
        action,
        count: result.modifiedCount,
        updatedBy: req.user?.id || 'system'
      });

      res.json({
        success: true,
        message: `${result.modifiedCount} commissions ${action}d successfully`,
        modifiedCount: result.modifiedCount
      });
    });
  } catch (err) {
    logger.error("BULK_COMMISSION_UPDATE_FAILED", req.body, err);
    res.status(500).json({
      success: false,
      error: "Failed to perform bulk operation"
    });
  } finally {
    session.endSession();
  }
});

// Enhanced webhook handler with better error handling
router.post("/webhook", async (req, res) => {
  try {
    // Verify webhook signature
    const shasum = crypto.createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest("hex");

    if (digest !== req.headers["x-razorpay-signature"]) {
      logger.warn("WEBHOOK_INVALID_SIGNATURE", { 
        receivedSignature: req.headers["x-razorpay-signature"],
        expectedSignature: digest 
      });
      return res.status(400).json({ error: "Invalid signature" });
    }

    const event = req.body;
    const eventType = event.event;
    const payload = event.payload;

    logger.info("WEBHOOK_RECEIVED", { event: eventType, entityId: payload?.payment?.entity?.id });

    switch (eventType) {
      case "payment.captured":
        await handlePaymentCaptured(payload.payment.entity);
        break;
        
      case "payment.failed":
        await handlePaymentFailed(payload.payment.entity);
        break;
        
      case "order.paid":
        await handleOrderPaid(payload.order.entity);
        break;
        
      case "payment.dispute.created":
        await handleDisputeCreated(payload.dispute.entity);
        break;
        
      default:
        logger.info("WEBHOOK_UNHANDLED_EVENT", { event: eventType });
    }

    res.json({ status: "ok" });
  } catch (err) {
    logger.error("WEBHOOK_ERROR", { body: req.body, headers: req.headers }, err);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

// Webhook helper functions
async function handlePaymentCaptured(payment) {
  try {
    const order = await Order.findOne({ razorpayOrderId: payment.order_id });
    if (order && order.status !== 'paid') {
      order.status = 'paid';
      await order.save();
      logger.info("WEBHOOK_ORDER_UPDATED", { orderId: order.orderId, status: 'paid' });
    }
  } catch (err) {
    logger.error("WEBHOOK_PAYMENT_CAPTURED_ERROR", { paymentId: payment.id }, err);
  }
}

async function handlePaymentFailed(payment) {
  try {
    await Order.findOneAndUpdate(
      { razorpayOrderId: payment.order_id },
      { status: "failed", updatedAt: new Date() }
    );
    logger.info("WEBHOOK_PAYMENT_FAILED", { 
      orderId: payment.order_id,
      reason: payment.error_reason 
    });
  } catch (err) {
    logger.error("WEBHOOK_PAYMENT_FAILED_ERROR", { paymentId: payment.id }, err);
  }
}

async function handleOrderPaid(order) {
  try {
    // Additional processing when order is fully paid
    logger.info("WEBHOOK_ORDER_PAID", { orderId: order.id });
  } catch (err) {
    logger.error("WEBHOOK_ORDER_PAID_ERROR", { orderId: order.id }, err);
  }
}

async function handleDisputeCreated(dispute) {
  try {
    // Handle dispute creation - notify relevant parties
    logger.warn("WEBHOOK_DISPUTE_CREATED", { 
      disputeId: dispute.id,
      paymentId: dispute.payment_id,
      amount: dispute.amount 
    });
  } catch (err) {
    logger.error("WEBHOOK_DISPUTE_CREATED_ERROR", { disputeId: dispute.id }, err);
  }
}

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0"
  });
});

// Export models for use in other modules
module.exports = {
  router,
  models: {
    Affiliate,
    Order,
    Payment,
    Commission
  },
  utilities: {
    generateUniqueId,
    generateReferralCode,
    logger
  }
};