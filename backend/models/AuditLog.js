const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    timestamp: { type: Date, default: Date.now, index: true },
    userId: { type: String, required: true },
    userRole: { type: String },
    ipAddress: { type: String },
    method: { type: String },
    endpoint: { type: String },
    action: { type: String },
    statusCode: { type: Number },
    responseTimeMs: { type: Number },
    userAgent: { type: String },
    resourceId: { type: String },
  },
  {
    timestamps: false,
    // Audit logs should never be deleted or modified
    capped: { size: 100 * 1024 * 1024, max: 500000 }, // 100MB capped collection
  }
);

auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ endpoint: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
