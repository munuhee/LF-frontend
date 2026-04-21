import mongoose, { Schema, Document, Model } from 'mongoose'

export type ReviewStatus = 'pending' | 'in-review' | 'approved' | 'rejected' | 'revision-requested'
export type ReviewDecision = 'approve' | 'reject' | 'request-rework' | 'escalate' | 'hold' | 'flag'

export interface IReview extends Document {
  taskId: mongoose.Types.ObjectId
  taskTitle: string
  batchId: mongoose.Types.ObjectId
  batchTitle: string
  workflowId: mongoose.Types.ObjectId
  annotatorId: mongoose.Types.ObjectId
  annotatorEmail: string
  annotatorName: string
  reviewerId?: mongoose.Types.ObjectId
  reviewerEmail?: string
  reviewerName?: string
  status: ReviewStatus
  decision?: ReviewDecision
  comments?: string
  reasonCode?: string
  qualityScore?: number
  criteriaScores?: {
    accuracy: number
    completeness: number
    adherence: number
  }
  submittedAt: Date
  reviewedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const ReviewSchema = new Schema<IReview>(
  {
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
    taskTitle: { type: String, required: true },
    batchId: { type: Schema.Types.ObjectId, ref: 'Batch', required: true },
    batchTitle: { type: String, required: true },
    workflowId: { type: Schema.Types.ObjectId, ref: 'Workflow', required: true },
    annotatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    annotatorEmail: { type: String, required: true },
    annotatorName: { type: String, required: true },
    reviewerId: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewerEmail: { type: String },
    reviewerName: { type: String },
    status: {
      type: String,
      enum: ['pending', 'in-review', 'approved', 'rejected', 'revision-requested'],
      default: 'pending',
    },
    decision: { type: String, enum: ['approve', 'reject', 'request-rework', 'escalate', 'hold', 'flag'] },
    comments: { type: String },
    reasonCode: { type: String },
    qualityScore: { type: Number, min: 0, max: 100 },
    criteriaScores: {
      accuracy: { type: Number },
      completeness: { type: Number },
      adherence: { type: Number },
    },
    submittedAt: { type: Date, required: true },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
)

const Review: Model<IReview> = mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema)
export default Review
