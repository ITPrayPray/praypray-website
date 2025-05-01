'use client';

import React, { useEffect, useState, useRef } from 'react';
// 恢復 Default Import
// Linter 可能會抱怨 Default Export，但這是根據文檔和功能推斷出的正確方式
import Purchases, { LogLevel, type CustomerInfo } from '@revenuecat/purchases-js';
// 導入 Supabase Auth Helpers
import { useUser } from '@supabase/auth-helpers-react';

// TODO: 從安全的地方讀取您的 RevenueCat Public API Key
const REVENUECAT_PUBLIC_API_KEY = process.env.NEXT_PUBLIC_REVENUECAT_PUBLIC_API_KEY || 'YOUR_REVENUECAT_PUBLIC_API_KEY';

// --- 使用者 ID 取得邏輯 ---
// ... (保持不變)

// --- (可選) 提供 CustomerInfo 和 Purchases 實例的 Context ---
interface RevenueCatContextType {
  customerInfo: CustomerInfo | null;
  isReady: boolean; // SDK 是否已設定完成
  purchasesInstance: Purchases | null; // 恢復提供 Purchases 實例
}

const RevenueCatContext = React.createContext<RevenueCatContextType>({
  customerInfo: null,
  isReady: false,
  purchasesInstance: null,
});

export const useRevenueCat = () => React.useContext(RevenueCatContext);


// --- Provider 元件 ---
export function RevenueCatProvider({ children }: { children: React.ReactNode }) {
  // 使用 useUser hook 獲取 Supabase 用戶信息
  const user = useUser(); 
  const appUserId = user?.id; // 獲取用戶 ID，如果用戶不存在則為 undefined
  
  const [isRevenueCatReady, setIsRevenueCatReady] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const purchasesRef = useRef<Purchases | null>(null);
  const configuredRef = useRef(false);
  // Ref to store the last used appUserId for identify/reset logic
  const lastAppUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    // API Key 檢查
    if (!REVENUECAT_PUBLIC_API_KEY || REVENUECAT_PUBLIC_API_KEY === 'YOUR_REVENUECAT_PUBLIC_API_KEY') {
      console.error("RevenueCat Public API Key 未設定！");
      return;
    }
    if (!Purchases) {
      console.error("RevenueCat SDK 未載入。");
      return;
    }

    const currentAppUserId = appUserId; // 獲取當前 useEffect 執行時的 userID

    // --- 首次設定 --- 
    if (!configuredRef.current) {
      console.log(`RevenueCatProvider: 首次設定，App User ID: ${currentAppUserId}`);
      Purchases.setLogLevel(LogLevel.Debug);
      try {
        const purchasesInstance = Purchases.configure(REVENUECAT_PUBLIC_API_KEY, currentAppUserId);
        purchasesRef.current = purchasesInstance;
        configuredRef.current = true;
        lastAppUserIdRef.current = currentAppUserId; // 儲存首次使用的 ID
        setIsRevenueCatReady(true);
        console.log("RevenueCatProvider: SDK 設定完成。");

        // --- 設定成功後，立即添加監聽器和獲取信息 --- 
        const instance = purchasesRef.current;
        if (instance) {
          const updateCustomerInfo = (info: CustomerInfo) => {
            console.log("RevenueCatProvider: CustomerInfo 更新:", info);
            setCustomerInfo(info);
          };
          instance.addCustomerInfoUpdateListener(updateCustomerInfo);
          instance.getCustomerInfo()
            .then((info: CustomerInfo) => {
              console.log("RC: 獲取初始 CustomerInfo 成功", info);
              setCustomerInfo(info)
            })
            .catch((error: unknown) => console.error("RC: 獲取初始 CustomerInfo 失敗", error));

          // 返回 cleanup function
          return () => {
            console.log("RevenueCatProvider: Cleanup effect (首次設定)");
            instance.removeCustomerInfoUpdateListener(updateCustomerInfo);
          };
        } else {
             console.error("RC: 設定後無法獲取實例?")
        }

      } catch (error) {
        console.error("RevenueCatProvider: 設定失敗:", error);
        configuredRef.current = false;
        setIsRevenueCatReady(false);
      }
    } 
    // --- 處理用戶狀態變化 (登入/登出) ---
    else if (configuredRef.current && currentAppUserId !== lastAppUserIdRef.current) {
      console.log(`RevenueCatProvider: 用戶狀態改變，舊 ID: ${lastAppUserIdRef.current}, 新 ID: ${currentAppUserId}`);
      const instance = purchasesRef.current;
      if (instance) {
        if (currentAppUserId) {
          // 用戶登入或切換
          console.log(`RevenueCatProvider: 調用 identify: ${currentAppUserId}`);
          instance.identify(currentAppUserId)
            .then(({ customerInfo: updatedInfo, created }: { customerInfo: CustomerInfo, created: boolean }) => {
              console.log(`RevenueCatProvider: Identify 完成 (用戶 ${created ? '創建' : '已存在'})`, updatedInfo);
              setCustomerInfo(updatedInfo); // 更新 customerInfo
              lastAppUserIdRef.current = currentAppUserId; // 更新記錄的 ID
            })
            .catch((error: unknown) => console.error("RC: Identify 失敗", error));
        } else {
          // 用戶登出
          console.log("RevenueCatProvider: 調用 reset");
          instance.reset()
            .then((info: CustomerInfo) => {
              console.log("RevenueCatProvider: Reset 完成", info);
              setCustomerInfo(info); // 更新 customerInfo (通常是匿名用戶的)
              lastAppUserIdRef.current = null; // 更新記錄的 ID 為 null
            })
            .catch((error: unknown) => console.error("RC: Reset 失敗", error));
        }
      }
    }

    // 注意：useEffect 的 cleanup function 只會在組件卸載或依賴項變化觸發重新執行前運行。
    // 上面的邏輯確保了監聽器只在首次成功配置時添加，並在組件卸載時移除。

  // 依賴 appUserId，當它從 undefined -> string (登入) 或 string -> undefined (登出) 時觸發
  }, [appUserId]); 

  // --- Context Provider --- 
  const contextValue = {
    customerInfo,
    isReady: isRevenueCatReady,
    purchasesInstance: purchasesRef.current,
  };

  return (
    <RevenueCatContext.Provider value={contextValue}>
      {children}
    </RevenueCatContext.Provider>
  );
}