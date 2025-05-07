import React from 'react';

export default function TermsAndConditionsPage() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-3xl">
            <h1 className="text-3xl font-bold mb-6">條款與條件 (Terms & Conditions)</h1>
            
            <div className="prose dark:prose-invert max-w-none">
                {/* You can add your terms and conditions content here */}
                <p className="text-muted-foreground">
                    [以下 Terms and Conditions（以下簡稱「本條款」）規範使用本 Web App（以下簡稱「本平台」）之所有 Users 行為，包含探索 religious spots 的使用者，以及寺廟擁有者（Temple Owners）與宗教服務提供者（Service Providers）之 Listings 創建與管理。平台僅對 Service Providers 收取 listing fee，寺廟擁有者及一般使用者免費使用。 ] 
                    <br />
                </p>
             
                {/* Example Sections (remove or replace) */}
                <h2 className="mt-8 text-xl font-semibold">1. 接受條款 (Acceptance of Terms)</h2>
                <p>使用者於註冊、存取或使用本平台任何功能時，即表示您同意受本條款約束，並承認閱讀並理解本條款所載之各項規定。</p>

                <h2 className="mt-6 text-xl font-semibold">2. 定義</h2>
                <p>本條款中，下列用詞具有以下含義：
                    1.	Services：指本平台提供之所有功能與服務
                    2.	Users：指註冊或使用本服務之個人
                    3.	Temple Owners：指創建與管理寺廟頁面之使用者
                    4.	Service Providers：指付費建立宗教服務頁面之對象
                    5.	Content：指使用者上傳、張貼或提供之任何文字、影像、影音等資料 
                </p>

                <h2 className="mt-6 text-xl font-semibold">3. 服務內容</h2>
                <p>本平台提供以下主要服務：探索與搜尋宗教景點、寺廟詳細資訊展示、Temple Owners 及 Service Providers 建立與管理 Listings、用戶評論與評價等功能。</p>

                <h2 className="mt-6 text-xl font-semibold">4. 帳號註冊與使用</h2>
                <p>為使用特定功能，使用者須以有效電子郵件註冊帳號，並負責維護帳號及密碼之安全。任何透過您帳號所進行之行為，均視為您本人操作，您須對此負全責。註冊時所填資訊須真實、準確。</p>

                <h2 className="mt-6 text-xl font-semibold">5. 費用與付款</h2>
                <p>本平台僅對 Service Providers 收取 listing fee，其他使用者（包含 Temple Owners 與一般 Users）享有免費使用。
                    相關費用依本平台公布之價格與 Payment Terms 辦理，並以您選擇之支付方式進行收取。
                    所有交易均透過安全支付通道處理，本平台不保留或儲存完整信用卡資料。
                </p>

                <h2 className="mt-6 text-xl font-semibold">6. 使用者內容</h2>
                <p>使用者於本平台上傳之任何 Content，應保證擁有合法權利（包括但不限於著作權、商標權、隱私權等），並對該 Content 負全責。您授予本平台全球性、非獨佔、免版稅、可轉授權使用權，以便展示、推廣及必要之改編。平台亦得刪除任何違反本條款之 Content。</p>

                <h2 className="mt-6 text-xl font-semibold">7. 智慧財產權</h2>
                <p>本平台及其內容（包括但不限於文字、圖片、標誌、程式碼與設計）係由本平台或相關權利人所擁有，受香港法律及國際法規保護。未經授權，不得複製、改作或散布，否則本平台得依法追究相關法律責任。</p>

                <h2 className="mt-6 text-xl font-semibold">8. 禁止行為</h2>
                <p>使用者於使用本平台時，應遵守下列禁止規範：
                        •	不得冒用他人身份、散布不法或誹謗言論、侵害他人隱私
                        •	不得上傳惡意程式或垃圾訊息
                        •	不得進行違法活動或任何違反公序良俗之行為
                    如有違反，本平台得停止您的帳號使用並保留法律追訴權。
                </p>

                <h2 className="mt-6 text-xl font-semibold">9. 責任限制</h2>
                <p>在法律允許範圍內，本平台及其關係企業、員工、合作夥伴對於使用或無法使用本服務所造成之任何間接、特殊、附帶或衍生性損害，不負任何賠償責任。此責任限制不影響使用者於法律上不可放棄之權利。</p>

                <h2 className="mt-6 text-xl font-semibold">10. 免責聲明</h2>
                <p>本平台 Services 以現狀（“AS IS”）提供，不對任何明示或暗示擔保負責，包括但不限於適售性、特定用途之適用性或不侵權擔保。</p>

                <h2 className="mt-6 text-xl font-semibold">11. 適用法律與爭議解決</h2>
                <p>本條款之解釋、適用及爭議解決，悉依香港法律辦理；對於任何因本條款所生之爭議，雙方同意以香港法院為管轄法院。</p>

                <h2 className="mt-6 text-xl font-semibold">12. 條款修改</h2>
                <p>本平台保留隨時修改本條款之權利，修改後內容自公布於網站或 App 時生效，並公告於平台；若您在條款發布後繼續使用本服務，將視為您已接受修改後之條款。</p>

                <h2 className="mt-6 text-xl font-semibold">13. 聯繫方式</h2>
                <p>如對本條款內容有任何疑問，請聯繫客服信箱：support@praypray.app，我們將竭誠為您服務。</p>

                {/* Add more sections as needed */}
            </div>
        </div>
    );
} 