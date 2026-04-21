import mongoose, { Schema, Document, Model } from 'mongoose'

export type BatchStatus = 'available' | 'in-progress' | 'completed' | 'pending-review'

export interface IBatch extends Document {
  workflowId: mongoose.Types.ObjectId
  workflowName: string
  title: string
  description: string
  instructions?: string
  taskType: string
  priority: number
  workloadEstimate: number
  status: BatchStatus
  tasksTotal: number
  tasksCompleted: number
  deadline?: Date
  assignedAnnotators: mongoose.Types.ObjectId[]
  createdBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const BatchSchema = new Schema<IBatch>(
  {
    workflowId: { type: Schema.Types.ObjectId, ref: 'Workflow', required: true },
    workflowName: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    instructions: { type: String, default: '' },
    taskType: { type: String, required: true },
    priority: { type: Number, default: 0.5, min: 0, max: 1 },
    workloadEstimate: { type: Number, default: 0 },
    status: { type: String, enum: ['available', 'in-progress', 'completed', 'pending-review'], default: 'available' },
    tasksTotal: { type: Number, default: 0 },
    tasksCompleted: { type: Number, default: 0 },
    deadline: { type: Date },
    assignedAnnotators: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
)

const Batch: Model<IBatch> = mongoose.models.Batch || mongoose.model<IBatch>('Batch', BatchSchema)
export default Batch
