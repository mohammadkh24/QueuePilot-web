import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { LoaderCircle } from 'lucide-react';

export function PageHeading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="page-heading"><div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h1>{title}</h1>{description && <p>{description}</p>}</div>{action}</div>;
}
export function Button({ children, variant = 'primary', loading = false, className = '', disabled, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; loading?: boolean }) {
  return <button {...props} className={`button button-${variant} ${className}`} disabled={loading || disabled}>{loading ? <LoaderCircle className="spin" size={17} /> : null}{children}</button>;
}
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) { return <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .35 }} className={`card ${className}`}>{children}</motion.section>; }
export function EmptyState({ title, description, icon }: { title: string; description: string; icon?: ReactNode }) { return <div className="empty-state"><div className="empty-icon">{icon}</div><strong>{title}</strong><p>{description}</p></div>; }
export function Field({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) { return <label className="field"><span>{label}</span><input {...props} /></label>; }
export function TextAreaField({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) { return <label className="field"><span>{label}</span><textarea {...props} /></label>; }
export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) { return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><motion.div className="modal" initial={{ opacity: 0, y: 20, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }}><div className="modal-head"><h3>{title}</h3><button className="icon-button" onClick={onClose}>×</button></div>{children}</motion.div></div>; }
export function Toast({ message, type = 'success' }: { message: string; type?: 'success' | 'error' }) { return <div className={`toast toast-${type}`}>{message}</div>; }
