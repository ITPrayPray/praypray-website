'use client';

import React from 'react';
import { Card } from '../ui/card';
import { formatDistanceToNow } from 'date-fns';

interface Post {
  comment_id: string;
  title: string;
  content: string;
  created_at: string;
  user_id: string;
  listing_id: string;
}

interface PostsSectionProps {
  posts: Post[];
}

export const PostsSection: React.FC<PostsSectionProps> = ({ posts }) => {
  // 格式化日期
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">
        Latest Updates
      </h2>
      
      {posts.length > 0 ? (
        <div className="space-y-6">
          {posts.map((post) => (
            <Card key={post.comment_id} className="p-6">
              <div className="space-y-4">
                {/* Post Header */}
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-semibold">
                    {post.title}
                  </h3>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(post.created_at)}
                  </span>
                </div>

                {/* Post Content */}
                <p className="whitespace-pre-wrap">
                  {post.content}
                </p>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-center py-8">
          No updates available yet.
        </p>
      )}
    </div>
  );
}; 