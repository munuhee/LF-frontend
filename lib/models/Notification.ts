import mongoose, { Schema, Document, Model } from 'mongoose'

export type NotificationType =
  | 'batch-assigned' | 'task-approved' | 'task-rejected' | 'review-needed'
  | 'priority-warning' | 'system' | 'escalation' | 'deadline'

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId
  type: NotificationType
  title: string
  message: string
  read: boolean
  actionUrl?: string
  createdAt: Date
  updatedAt: Date
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['batch-assigned', 'task-approved', 'task-rejected', 'review-needed', 'priority-warning', 'system', 'escalation', 'deadline'],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    actionUrl: { type: String },
  },
  { timestamps: true }
)

NotificationSchema.index({ userId: 1, createdAt: -1 })

const Notification: Model<INotification> =
  mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema)
export default Notification
