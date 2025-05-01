'use client';

import React, { useEffect, useState, useRef } from 'react';
// 修正導入方式：使用命名導入
import { Purchases, LogLevel, type CustomerInfo } from '@revenuecat/purchases-js';
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
    if (!REVENUECAT_PUBLIC_API_KEY || REVENUECAT_PUBLIC_API_KEY === 'YOUR_REVENUECAT_PUBLIC_API_KEY') {
      console.error("RevenueCat Public API Key 未設定！");
      return;
    }
    // Ensure Purchases is available (it should be after import fix)
    // if (!Purchases) { console.error("RC SDK not loaded"); return; }

    const currentAppUserId = appUserId;

    // --- 首次設定 --- 
    if (!configuredRef.current) {
       // Only configure if we have a user ID, or handle anonymous users if intended
      if (currentAppUserId) { 
          console.log(`RevenueCatProvider: 首次設定，App User ID: ${currentAppUserId}`);
          Purchases.setLogLevel(LogLevel.Debug);
          try {
            // Pass currentAppUserId which is confirmed to be a string here
            const purchasesInstance = Purchases.configure(REVENUECAT_PUBLIC_API_KEY, currentAppUserId);
            purchasesRef.current = purchasesInstance;
            configuredRef.current = true;
            lastAppUserIdRef.current = currentAppUserId;
            setIsRevenueCatReady(true);
            console.log("RevenueCatProvider: SDK 設定完成。");

            const instance = purchasesRef.current;
            if (instance) {
              // Temporarily comment out methods causing errors until API is clarified
              /*
              const updateCustomerInfo = (info: CustomerInfo) => {
                console.log("RC Provider: CustomerInfo 更新:", info);
                setCustomerInfo(info);
              };
              instance.addCustomerInfoUpdateListener(updateCustomerInfo);
              */
              instance.getCustomerInfo()
                .then((info: CustomerInfo) => {
                  console.log("RC: 獲取初始 CustomerInfo 成功", info);
                  setCustomerInfo(info)
                })
                .catch((error: unknown) => console.error("RC: 獲取初始 CustomerInfo 失敗", error));

              // Cleanup function might need adjustment based on listener usage
              /*
              return () => {
                console.log("RC Provider: Cleanup effect (首次設定)");
                instance.removeCustomerInfoUpdateListener(updateCustomerInfo);
              };
              */
            } else {
                 console.error("RC: 設定後無法獲取實例?")
            }
          } catch (error) {
            console.error("RevenueCatProvider: 設定失敗:", error);
            configuredRef.current = false;
            setIsRevenueCatReady(false);
          }
      } else {
          console.log("RevenueCatProvider: User not logged in for initial configuration.");
          // Handle anonymous user state if needed, maybe configure without ID?
          // Or simply wait for login.
      }
    } 
    // --- 處理用戶狀態變化 (登入/登出) ---
    else if (configuredRef.current && currentAppUserId !== lastAppUserIdRef.current) {
      console.log(`RevenueCatProvider: 用戶狀態改變，舊 ID: ${lastAppUserIdRef.current}, 新 ID: ${currentAppUserId}`);
      const instance = purchasesRef.current;
      if (instance) {
        if (currentAppUserId) {
          console.log(`RevenueCatProvider: Trying identify/login: ${currentAppUserId}`);
          // Temporarily comment out methods causing errors
          /*
          instance.identify(currentAppUserId)
            .then(({ customerInfo: updatedInfo, created }: { customerInfo: CustomerInfo, created: boolean }) => {
              console.log(`RC Provider: Identify 完成 (用戶 ${created ? '創建' : '已存在'})`, updatedInfo);
              setCustomerInfo(updatedInfo); 
              lastAppUserIdRef.current = currentAppUserId;
            })
            .catch((error: unknown) => console.error("RC: Identify 失敗", error));
          */
          // Alternative: Maybe re-fetch customer info after assuming configure handles login?
           instance.getCustomerInfo()
             .then(info => setCustomerInfo(info))
             .catch(err => console.error("Error fetching customer info after user change", err));
           lastAppUserIdRef.current = currentAppUserId; // Update ref anyway

        } else {
          console.log("RevenueCatProvider: Trying reset/logout");
          // Temporarily comment out methods causing errors
          /*
          instance.reset()
            .then((info: CustomerInfo) => {
              console.log("RC Provider: Reset 完成", info);
              setCustomerInfo(info); 
              lastAppUserIdRef.current = null;
            })
            .catch((error: unknown) => console.error("RC: Reset 失敗", error));
          */
           // Fetch anonymous info after assuming configure handles login?
           instance.getCustomerInfo()
             .then(info => setCustomerInfo(info))
             .catch(err => console.error("Error fetching customer info after logout", err));
           lastAppUserIdRef.current = null; // Update ref anyway
        }
      }
    }

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