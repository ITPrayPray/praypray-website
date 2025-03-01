'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { StarRating } from './StarRating';
import { DetailData } from '../DetailPage';
import { formatDistanceToNow } from 'date-fns';
import { PlusCircle, Send, MessageCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface ReviewSectionProps {
  reviews: DetailData['reviews'];
  listingId: string;
}

/**
 * ReviewSection - Social media post-like display of user reviews with the ability to add new ones
 * Features responsive design, user avatars, and interactive rating selection
 */
export const ReviewSection: React.FC<ReviewSectionProps> = ({ reviews, listingId }) => {
  const [isAddingReview, setIsAddingReview] = useState(false);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate average rating
  const averageRating = reviews.length 
    ? (reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  // Handle review submission
  const handleAddReview = async () => {
    if (newReviewRating === 0) {
      alert('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // In a real application, you would implement this with your API
      // await fetch('/api/reviews', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     listing_id: listingId,
      //     rating: newReviewRating,
      //     comment: newReviewComment
      //   })
      // });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reset form and close it
      setNewReviewComment('');
      setNewReviewRating(0);
      setIsAddingReview(false);
      
      // In a real app, you would refresh the reviews
      alert('Review submitted successfully!');
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date to relative time (e.g., "2 days ago")
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      return dateString;
    }
  };

  // Default avatar URL for users without one
  const defaultAvatar = "https://api.dicebear.com/7.x/initials/svg?seed=";

  return (
    <div className="space-y-6">
      {/* Reviews Header with Rating Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <MessageCircle className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Reviews</h2>
          
          {reviews.length > 0 && (
            <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
              <span className="text-amber-500 font-bold">{averageRating}</span>
              <StarRating rating={parseFloat(averageRating)} size={16} />
              <span className="text-sm text-gray-500">({reviews.length})</span>
            </div>
          )}
        </div>
        
        <Button
          onClick={() => setIsAddingReview(!isAddingReview)}
          variant={isAddingReview ? "outline" : "default"}
          className="flex items-center gap-2"
        >
          {isAddingReview ? 'Cancel' : (
            <>
              <PlusCircle className="h-4 w-4" />
              Write a Review
            </>
          )}
        </Button>
      </div>
      
      {/* Add Review Form */}
      {isAddingReview && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-border mb-6 transition-all duration-300">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Share Your Experience</h3>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">How would you rate this place?</label>
              <StarRating
                rating={newReviewRating}
                onChange={setNewReviewRating}
                size={28}
                interactive
              />
            </div>
            
            <div>
              <label htmlFor="comment" className="block text-sm font-medium mb-2 text-gray-700">
                Your Review
              </label>
              <Textarea
                id="comment"
                value={newReviewComment}
                onChange={(e) => setNewReviewComment(e.target.value)}
                placeholder="Tell others about your experience..."
                rows={4}
                className="resize-none focus:border-primary"
              />
            </div>
            
            <div className="flex justify-end">
              <Button
                onClick={handleAddReview}
                disabled={isSubmitting || newReviewRating === 0 || !newReviewComment.trim()}
                className="flex items-center gap-2"
              >
                {isSubmitting ? 'Submitting...' : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit Review
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Reviews List */}
      {reviews.length > 0 ? (
        <div className="space-y-6">
          {reviews.map((review, index) => (
            <div 
              key={review.id || index} 
              className={cn(
                "bg-white rounded-xl p-5 border border-border shadow-sm transition-all duration-200",
                "hover:shadow-md"
              )}
            >
              {/* Review Header - User Info and Rating */}
              <div className="flex items-start gap-3 mb-3">
                <div className="relative h-12 w-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                  {review.user_avatar ? (
                    <Image
                      src={review.user_avatar}
                      alt={`${review.user_name}'s avatar`}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="bg-primary/10 h-full w-full flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">{review.user_name}</h3>
                    <div className="text-xs text-gray-500">{formatDate(review.created_at)}</div>
                  </div>
                  
                  <div className="flex items-center mt-1">
                    <StarRating rating={review.rating} size={16} />
                  </div>
                </div>
              </div>
              
              {/* Review Content */}
              <div className="text-gray-700 leading-relaxed">
                <p>{review.comment}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-10 bg-gray-50 rounded-xl border border-gray-200">
          <MessageCircle className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No Reviews Yet</h3>
          <p className="text-gray-500 mb-4">Be the first to share your experience!</p>
          <Button 
            onClick={() => setIsAddingReview(true)}
            className="flex items-center gap-2 mx-auto"
          >
            <PlusCircle className="h-4 w-4" />
            Write a Review
          </Button>
        </div>
      )}
    </div>
  );
};