import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const { ObjectId } = Schema.Types;

function model<T extends Schema>(name: string, schema: T): Model<InferSchemaType<T>> {
  return (mongoose.models[name] as Model<InferSchemaType<T>>) || mongoose.model(name, schema);
}

export const ROLES = ["SUPER_ADMIN", "MANAGER", "STAFF"] as const;
export type Role = (typeof ROLES)[number];
export const CERT_STATUSES = ["VALID", "SUSPENDED", "REVOKED"] as const;
export const INQUIRY_STATUSES = ["NEW", "IN_PROGRESS", "CLOSED"] as const;
export const GCC_COUNTRIES = ["Saudi Arabia", "UAE", "Qatar", "Kuwait", "Oman", "Bahrain"] as const;

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: "STAFF", required: true },
    locations: [{ type: ObjectId, ref: "Location" }],
    isActive: { type: Boolean, default: true },
    sessionVersion: { type: Number, default: 0 },
    lastLoginAt: Date,
  },
  { timestamps: true },
);
export const User = model("User", UserSchema);

const LocationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    label: { type: String, trim: true, default: "" },
    city: { type: String, required: true, trim: true },
    country: { type: String, enum: GCC_COUNTRIES, required: true },
    description: { type: String, default: "" },
    address: { type: String, default: "" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    mapUrl: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    isHeadOffice: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);
export const Location = model("Location", LocationSchema);

const CategorySchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    shortName: { type: String, default: "" },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);
export const Category = model("Category", CategorySchema);

const CourseSchema = new Schema(
  {
    category: { type: ObjectId, ref: "Category", required: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    shortDescription: { type: String, default: "" },
    description: { type: String, default: "" },
    whoShouldAttend: { type: String, default: "" },
    duration: { type: String, default: "" },
    defaultValidityMonths: { type: Number, default: 24, min: 1, max: 120 },
    deliveryMode: { type: String, default: "Classroom & practical assessment" },
    imageUrl: { type: String, default: "" },
    showOnWebsite: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);
export const Course = model("Course", CourseSchema);

const TraineeSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    idNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
    nationality: { type: String, default: "" },
    dob: Date,
    phone: { type: String, default: "" },
    email: { type: String, default: "", lowercase: true, trim: true },
    company: { type: String, default: "" },
    photoUrl: { type: String, default: "" },
    homeLocation: { type: ObjectId, ref: "Location", index: true },
    isDemo: { type: Boolean, default: false },
    createdBy: { type: ObjectId, ref: "User" },
  },
  { timestamps: true },
);
TraineeSchema.index({ fullName: "text", idNumber: "text", company: "text" });
export const Trainee = model("Trainee", TraineeSchema);

const TrainerSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    designation: { type: String, default: "" },
    type: { type: String, enum: ["TRAINER", "APPROVER"], default: "TRAINER" },
    signatureUrl: { type: String, default: "" },
    location: { type: ObjectId, ref: "Location" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);
export const Trainer = model("Trainer", TrainerSchema);

const CertificateSchema = new Schema(
  {
    certificateNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    trainee: { type: ObjectId, ref: "Trainee", required: true, index: true },
    course: { type: ObjectId, ref: "Course", required: true, index: true },
    location: { type: ObjectId, ref: "Location", required: true, index: true },
    trainer: { type: ObjectId, ref: "Trainer" },
    approver: { type: ObjectId, ref: "Trainer" },
    level: { type: String, default: "" },
    company: { type: String, default: "", index: true },
    project: { type: String, default: "" },
    enrollmentNumber: { type: String, default: "" },
    trainingStartDate: Date,
    trainingEndDate: Date,
    issueDate: { type: Date, required: true, index: true },
    expiryDate: { type: Date, required: true, index: true },
    status: { type: String, enum: CERT_STATUSES, default: "VALID", index: true },
    revokeReason: { type: String, default: "" },
    notes: { type: String, default: "" },
    isDemo: { type: Boolean, default: false },
    createdBy: { type: ObjectId, ref: "User" },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true },
);
export const Certificate = model("Certificate", CertificateSchema);

const InquirySchema = new Schema(
  {
    name: { type: String, required: true },
    company: { type: String, default: "" },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    country: { type: String, default: "" },
    type: { type: String, default: "Course Inquiry" },
    course: { type: ObjectId, ref: "Course" },
    courseName: { type: String, default: "" },
    traineesCount: { type: Number, default: null },
    message: { type: String, required: true },
    status: { type: String, enum: INQUIRY_STATUSES, default: "NEW", index: true },
    notes: { type: String, default: "" },
    fingerprint: { type: String, index: true },
  },
  { timestamps: true },
);
export const Inquiry = model("Inquiry", InquirySchema);

const VerificationLogSchema = new Schema(
  {
    searchedNumber: { type: String, required: true },
    certificate: { type: ObjectId, ref: "Certificate" },
    result: { type: String, enum: ["VALID", "EXPIRED", "REVOKED", "SUSPENDED", "NOT_FOUND"], required: true, index: true },
    clientId: String,
    userAgent: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
VerificationLogSchema.index({ createdAt: -1 });
export const VerificationLog = model("VerificationLog", VerificationLogSchema);

const ActivityLogSchema = new Schema(
  {
    user: { type: ObjectId, ref: "User" },
    userEmail: String,
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: String,
    details: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
ActivityLogSchema.index({ createdAt: -1 });
export const ActivityLog = model("ActivityLog", ActivityLogSchema);

const SettingSchema = new Schema(
  { key: { type: String, required: true, unique: true }, value: { type: Schema.Types.Mixed } },
  { timestamps: true },
);
export const Setting = model("Setting", SettingSchema);

const PageContentSchema = new Schema(
  { slug: { type: String, required: true, unique: true }, title: String, body: { type: Schema.Types.Mixed } },
  { timestamps: true },
);
export const PageContent = model("PageContent", PageContentSchema);

const StoredUploadSchema = new Schema(
  {
    folder: { type: String, required: true },
    filename: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    data: { type: Buffer, required: true, select: false },
    uploadedBy: { type: ObjectId, ref: "User" },
  },
  { timestamps: true },
);
StoredUploadSchema.index({ folder: 1, filename: 1 }, { unique: true });
export const StoredUpload = model("StoredUpload", StoredUploadSchema);

const UploadChunkSchema = new Schema(
  {
    uploadId: { type: String, required: true },
    index: { type: Number, required: true },
    data: { type: Buffer, required: true },
    owner: { type: ObjectId, ref: "User", required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);
UploadChunkSchema.index({ uploadId: 1, index: 1 }, { unique: true });
UploadChunkSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const UploadChunk = model("UploadChunk", UploadChunkSchema);

const PasswordResetTokenSchema = new Schema(
  {
    user: { type: ObjectId, ref: "User", required: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    usedAt: Date,
  },
  { timestamps: true },
);
PasswordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const PasswordResetToken = model("PasswordResetToken", PasswordResetTokenSchema);

const RateLimitSchema = new Schema({
  key: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true },
});
RateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const RateLimit = model("RateLimit", RateLimitSchema);

const CounterSchema = new Schema({ key: { type: String, required: true, unique: true }, seq: { type: Number, default: 0 } });
export const Counter = model("Counter", CounterSchema);

export const ALL_MODELS = [
  User, Location, Category, Course, Trainee, Trainer, Certificate, Inquiry, VerificationLog,
  ActivityLog, Setting, PageContent, StoredUpload, UploadChunk, PasswordResetToken, RateLimit, Counter,
];
