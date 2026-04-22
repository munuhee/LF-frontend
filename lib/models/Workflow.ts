import mongoose, { Schema, Document, Model } from 'mongoose'

export type WorkflowType =
  | 'agentic-ai' | 'llm-training' | 'multimodal' | 'evaluation'
  | 'benchmarking' | 'preference-ranking' | 'red-teaming' | 'data-collection'

export interface IWorkflow extends Document {
  name: string
  description: string
  type: WorkflowType
  isActive: boolean
  assignedUsers: mongoose.Types.ObjectId[]
  createdBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const WorkflowSchema = new Schema<IWorkflow>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    type: {
      type: String,
      enum: ['agentic-ai', 'llm-training', 'multimodal', 'evaluation', 'benchmarking', 'preference-ranking', 'red-teaming', 'data-collection'],
      required: true,
    },
    isActive: { type: Boolean, default: true },
    assignedUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
)

const Workflow: Model<IWorkflow> = mongoose.models.Workflow || mongoose.model<IWorkflow>('Workflow', WorkflowSchema)
export default Workflow
