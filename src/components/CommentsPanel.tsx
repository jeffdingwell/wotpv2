import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Comment } from '../types';
import { signInWithGoogle } from '../lib/firebase';
import ConfirmDialog from './ConfirmDialog';

interface CommentsPanelProps {
  comments: Comment[];
  onAddComment: (text: string) => void;
  onDeleteComment?: (id: string) => void;
  isAdmin?: boolean;
  currentUserId?: string;
}

export default function CommentsPanel({ 
  comments, 
  onAddComment, 
  onDeleteComment,
  isAdmin,
  currentUserId 
}: CommentsPanelProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    onAddComment(newComment);
    setNewComment('');
    setIsAdding(false);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'JUST NOW';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).toUpperCase();
  };

  return (
    <div className="px-8 flex flex-col h-full overflow-hidden">
      {/* Action Header */}
      {currentUserId && (
        !isAdding ? (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 py-6 transition-colors text-sm font-medium sticky top-0 bg-white z-10"
          >
            <Plus size={18} />
            <span>Add new</span>
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="py-6 space-y-4">
            <textarea
              autoFocus
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add your message"
              className="w-full border border-gray-200 p-4 min-h-[120px] outline-none focus:border-blue-500 text-sm placeholder:text-gray-400"
            />
            <div className="flex items-center space-x-6">
              <button
                type="submit"
                className="bg-[#24459c] text-white px-6 py-2 text-sm font-medium hover:bg-blue-800 transition-colors"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="text-gray-500 hover:text-black text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )
      )}

      {/* divider */}
      {currentUserId && <div className="border-t border-gray-100 mb-6" />}


      {/* List */}
      <div className="flex-1 space-y-8 pb-10 overflow-y-auto custom-scrollbar">
        {comments.length === 0 ? (
          <p className="text-gray-400 text-sm italic">No comments yet. Be the first!</p>
        ) : (
          comments.map((comment, index) => {
            const canDelete = isAdmin || (currentUserId && comment.userId === currentUserId);
            
            return (
              <div key={comment.id || index} className={`space-y-3 group relative ${index === 0 ? 'mt-4' : ''}`}>
                <p className="text-[15px] leading-relaxed text-gray-800 font-light pr-8">
                  {comment.text}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 text-[10px] tracking-[0.15em] font-semibold text-gray-400 uppercase">
                    <span>{formatDate(comment.createdAt)}</span>
                    <span className="text-gray-200">|</span>
                    <span>{comment.userName}</span>
                  </div>
                  
                  {canDelete && onDeleteComment && comment.id && (
                    <button
                      onClick={() => setDeleteTarget(comment.id!)}
                      className="text-red-400 hover:text-red-700 transition-colors opacity-0 group-hover:opacity-100 p-1"
                      title="Delete comment"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                {index < comments.length - 1 && (
                  <div className="pt-4 border-b border-dotted border-gray-200" />
                )}
              </div>
            );
          })
        )}
      </div>

      <ConfirmDialog 
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget && onDeleteComment) {
            onDeleteComment(deleteTarget);
          }
        }}
        message="Are you sure you want to delete this?"
      />
    </div>
  );
}
