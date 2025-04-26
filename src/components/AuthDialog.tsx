// src/components/AuthDialog.tsx
"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export default function AuthDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const supabase = createClient();

  const handleAuth = async () => {
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        alert(error.message);
      } else {
        onClose();
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
        alert(error.message);
      } else {
        alert("注册成功，请检查您的邮箱以验证账户。");
        setIsLogin(true);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card text-card-foreground shadow-lg rounded-lg p-6">
        <DialogHeader>
          <DialogTitle>{isLogin ? "登录" : "注册"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="email">email</Label>
            <Input
              id="email"
              type="email"
              placeholder="請輸入email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="password">password</Label>
            <Input
              id="password"
              type="password"
              placeholder="請輸入password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button onClick={handleAuth} className="w-full">
            {isLogin ? "登入" : "注册"}
          </Button>
          <Button
            variant="link"
            onClick={() => setIsLogin(!isLogin)}
            className="w-full"
          >
            {isLogin ? "未有Account？注册" : "已有Account？登入"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
