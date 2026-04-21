import mongoose, { Schema, Document, Model } from 'mongoose'

export type TaskStatus =
  | 'unclaimed' | 'in-progress' | 'paused' | 'submitted'
  | 'approved' | 'rejected' | 'revision-requested'

export interface ITask extends Document {
  batchId: mongoose.Types.ObjectId
  batchTitle: string
  workflowId: mongoose.Types.ObjectId
  workflowName: string
  title: string
  description: string
  taskType: string
  status: TaskStatus
  priority: number
  externalUrl?: string
  estimatedDuration: number
  actualDuration?: number
  annotatorId?: mongoose.Types.ObjectId
  annotatorEmail?: string
  reviewerId?: mongoose.Types.ObjectId
  reviewerEmail?: string
  feedback?: string
  qualityScore?: number
  notes?: string
  submissionData?: Record<string, unknown>
  screenshots?: string[]
  extensionData?: Record<string, unknown>
  startedAt?: Date
  completedAt?: Date
  submittedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const TaskSchema = new Schema<ITask>(
  {
    batchId: { type: Schema.Types.ObjectId, ref: 'Batch', required: true },
    batchTitle: { type: String, required: true },
    workflowId: { type: Schema.Types.ObjectId, ref: 'Workflow', required: true },
    workflowName: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    taskType: { type: String, required: true },
    status: {
      type: String,
      enum: ['unclaimed', 'in-progress', 'paused', 'submitted', 'approved', 'rejected', 'revision-requested'],
      default: 'unclaimed',
    },
    priority: { type: Number, default: 0.5 },
    externalUrl: { type: String },
    estimatedDuration: { type: Number, default: 30 },
    actualDuration: { type: Number },
    annotatorId: { type: Schema.Types.ObjectId, ref: 'User' },
    annotatorEmail: { type: String },
    reviewerId: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewerEmail: { type: String },
    feedback: { type: String },
    qualityScore: { type: Number },
    notes: { type: String },
    submissionData: { type: Schema.Types.Mixed },
    screenshots: [{ type: String }],
    extensionData: { type: Schema.Types.Mixed },
    startedAt: { type: Date },
    completedAt: { type: Date },
    submittedAt: { type: Date },
  },
  { timestamps: true }
)

const Task: Model<ITask> = mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema)
export default Task
