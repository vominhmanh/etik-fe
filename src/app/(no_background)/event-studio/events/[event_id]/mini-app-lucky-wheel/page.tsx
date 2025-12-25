'use client';

import "./style.css";
import React, { useState, useEffect } from "react";
import dynamic from 'next/dynamic';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import { AxiosResponse } from 'axios';

const Wheel = dynamic(
  () => import('react-custom-roulette').then((m: any) => m.Wheel),
  { ssr: false }
) as any;

interface LuckyWheelConfig {
  id: number;
  eventId: number;
  name: string;
  status: 'active' | 'inactive' | 'ended';
}

interface LuckyWheelPrize {
  id: number;
  luckyWheelConfigId: number;
  name: string;
  imageUrl?: string | null;
  prizeValue?: any;
  probability: number;
  quantityTotal?: number | null;
  quantityLeft?: number | null;
  createdAt: string;
}

interface LuckyWheelDataResponse {
  config: LuckyWheelConfig;
  prizes: LuckyWheelPrize[];
}

interface RegisterLuckyWheelUserRequest {
  fullName: string;
  invoiceCode: string;
  phoneNumber: string;
  totalSpin: number;
}

interface RegisterLuckyWheelUserResponse {
  token: string;
  userId: number;
  fullName: string;
  totalSpin: number;
  usedSpin: number;
  remainingSpins: number;
}

interface SpinLuckyWheelRequest {
  userId: number;
  token: string;
  requestId: string;
}

interface SpinLuckyWheelResponse {
  prizeId: number;
  prizeName: string;
  prizeImageUrl?: string | null;
  isWin: boolean;
  spinIndex: number;
  remainingSpins: number;
}

interface MySpinHistoryRow {
  id: number;
  prizeId?: number | null;
  prizeName?: string | null;
  prizeImageUrl?: string | null;
  spinIndex: number;
  isWin: boolean;
  createdAt: string;
}

// Default colors for the wheel
const DEFAULT_COLORS = [
  "#165FA9",
  "#239b63",
  "#F7A415",
  "#3F297E",
  "#BE1080",
  "#DC0836",
];

// Generate colors array based on number of prizes
const generateColors = (count: number): string[] => {
  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    colors.push(DEFAULT_COLORS[i % DEFAULT_COLORS.length]);
  }
  return colors;
};

// Convert prizes to wheel data format
const convertPrizesToWheelData = (prizes: LuckyWheelPrize[]) => {
  return prizes.map((prize) => {
    const item: any = {};
    
    if (prize.imageUrl) {
      item.image = {
        uri: prize.imageUrl,
        landscape: true,
        sizeMultiplier: 0.75,
        offsetX: 0,
      };
      // item.style = {
      //   maxWidth: 48,
      //   maxHeight: 48,
      //   width: 48,
      //   height: 48,
      // };
    } else {
      item.option = prize.name;
    }
    
    return item;
  });
};

export default function Page({ params }: { params: { event_id: number } }) {
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [wheelData, setWheelData] = useState<any[]>([]);
  const [backgroundColors, setBackgroundColors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prizes, setPrizes] = useState<LuckyWheelPrize[]>([]);
  const [showCongratsModal, setShowCongratsModal] = useState(false);
  const [winningPrize, setWinningPrize] = useState<LuckyWheelPrize | null>(null);

  const [auth, setAuth] = useState<RegisterLuckyWheelUserResponse | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [spinLoading, setSpinLoading] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyRows, setHistoryRows] = useState<MySpinHistoryRow[]>([]);
  const [registerForm, setRegisterForm] = useState<RegisterLuckyWheelUserRequest>({
    fullName: "",
    invoiceCode: "",
    phoneNumber: "",
    totalSpin: 1,
  });

  useEffect(() => {
    const fetchLuckyWheelData = async () => {
      try {
        setLoading(true);
        const response: AxiosResponse<LuckyWheelDataResponse> = await baseHttpServiceInstance.get(
          `/mini-app-lucky-wheel/${params.event_id}/data`
        );
        
        const { prizes: prizesData } = response.data;
        
        if (!prizesData || prizesData.length === 0) {
          setError('Không có giải thưởng nào');
          return;
        }
        
        // Store prizes for later use
        setPrizes(prizesData);
        
        // Convert prizes to wheel format
        const data = convertPrizesToWheelData(prizesData);
        setWheelData(data);
        
        // Generate colors
        const colors = generateColors(prizesData.length);
        setBackgroundColors(colors);
      } catch (err: any) {
        console.error('Failed to fetch lucky wheel data:', err);
        setError(err?.response?.data?.detail || 'Không thể tải dữ liệu vòng quay may mắn');
      } finally {
        setLoading(false);
      }
    };

    fetchLuckyWheelData();
  }, [params.event_id]);

  const createRequestId = () => {
    try {
      // Browser-native UUID (no extra deps)
      // @ts-ignore
      if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    } catch {}
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  };

  const normalizeVietnamPhoneToE164 = (raw: string): { e164: string | null; error?: string } => {
    const digitsOnly = (raw || '').replace(/[^\d]/g, '');

    // Validate user input as 0xxx... (per requirement), then convert to +84...
    if (!digitsOnly.startsWith('0')) {
      return { e164: null, error: 'Số điện thoại phải bắt đầu bằng 0 (0xxx...)' };
    }

    // VN phone numbers commonly 10 digits starting with 0 (ex: 09xxxxxxxx)
    if (digitsOnly.length < 9 || digitsOnly.length > 11) {
      return { e164: null, error: 'Số điện thoại không hợp lệ' };
    }

    return { e164: `+84${digitsOnly.slice(1)}` };
  };

  const getRemainingSpinsFromSpinResponse = (data: any): number | null => {
    const v = data?.remainingSpins ?? data?.remaining_spins;
    if (typeof v === 'number') return v;
    if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v);
    return null;
  };

  const doSpin = async (userId: number, token: string, authSnapshot?: RegisterLuckyWheelUserResponse) => {
    try {
      setSpinLoading(true);
      setRegisterError(null);

      const payload: SpinLuckyWheelRequest = {
        userId,
        token,
        requestId: createRequestId(),
      };

      const res: AxiosResponse<SpinLuckyWheelResponse> = await baseHttpServiceInstance.post(
        `/mini-app-lucky-wheel/${params.event_id}/spin`,
        payload
      );

      const spinIndex = res.data.spinIndex ?? 0;
      setPrizeNumber(spinIndex);

      const selected = prizes.find((p) => p.id === res.data.prizeId) || prizes[spinIndex] || null;
      setWinningPrize(selected);

      const remaining = getRemainingSpinsFromSpinResponse(res.data);
      if (remaining !== null) {
        setAuth((prev) => {
          const base = prev || authSnapshot;
          if (!base) return prev;
          return { ...base, remainingSpins: remaining };
        });
      }

      setMustSpin(true);
    } catch (err: any) {
      console.error('Spin failed:', err);
      setInfoMessage(err?.response?.data?.detail || 'Không thể quay số');
      setShowInfoModal(true);
    } finally {
      setSpinLoading(false);
    }
  };

  const handleRegisterAndSpin = async () => {
    try {
      setRegisterLoading(true);
      setRegisterError(null);

      if (!registerForm.fullName.trim()) {
        setRegisterError("Vui lòng nhập họ tên");
        return;
      }
      if (!registerForm.invoiceCode.trim()) {
        setRegisterError("Vui lòng nhập mã hóa đơn");
        return;
      }
      if (!registerForm.phoneNumber.trim()) {
        setRegisterError("Vui lòng nhập số điện thoại");
        return;
      }

      const phone = normalizeVietnamPhoneToE164(registerForm.phoneNumber);
      if (!phone.e164) {
        setRegisterError(phone.error || 'Số điện thoại không hợp lệ');
        return;
      }
      if (!registerForm.totalSpin || registerForm.totalSpin < 1) {
        setRegisterError("Số lượng vòng quay phải lớn hơn 0");
        return;
      }
      if (registerForm.totalSpin > 2) {
        setRegisterError("Số lượng vòng quay tối đa là 2");
        return;
      }

      const res: AxiosResponse<RegisterLuckyWheelUserResponse> = await baseHttpServiceInstance.post(
        `/mini-app-lucky-wheel/${params.event_id}/register`,
        {
          ...registerForm,
          phoneNumber: phone.e164,
        }
      );

      // Be tolerant to backend response keys (camelCase vs snake_case)
      const authData: RegisterLuckyWheelUserResponse = {
        token: (res.data as any).token,
        userId: (res.data as any).userId ?? (res.data as any).user_id,
        fullName: (res.data as any).fullName ?? (res.data as any).full_name,
        totalSpin: (res.data as any).totalSpin ?? (res.data as any).total_spin,
        usedSpin: (res.data as any).usedSpin ?? (res.data as any).used_spin,
        remainingSpins: (res.data as any).remainingSpins ?? (res.data as any).remaining_spins,
      };

      setAuth(authData);
      setShowRegisterModal(false);
    } catch (err: any) {
      console.error('Register failed:', err);
      setRegisterError(err?.response?.data?.detail || 'Không thể đăng ký người chơi');
    } finally {
      setRegisterLoading(false);
    }
  };

  const fetchMyHistory = async () => {
    if (!auth) return;
    try {
      setHistoryLoading(true);
      const res: AxiosResponse<MySpinHistoryRow[]> = await baseHttpServiceInstance.get(
        `/mini-app-lucky-wheel/${params.event_id}/history`,
        {
          params: { userId: auth.userId, token: auth.token, limit: 50 },
        }
      );
      setHistoryRows(res.data || []);
      setShowHistoryModal(true);
    } catch (err: any) {
      console.error('Fetch history failed:', err);
      setInfoMessage(err?.response?.data?.detail || 'Không thể tải lịch sử quay');
      setShowInfoModal(true);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSpinClick = () => {
    if (wheelData.length === 0) return;
    if (mustSpin || spinLoading) return;

    if (!auth) {
      setRegisterError(null);
      setShowRegisterModal(true);
      return;
    }

    if (auth.remainingSpins <= 0) {
      setInfoMessage("Bạn đã hết lượt quay");
      setShowInfoModal(true);
      return;
    }

    void doSpin(auth.userId, auth.token);
  };

  if (loading) {
    return (
      <div className="wheel-container">
        <div style={{ color: 'white', fontSize: '18px' }}>Đang tải...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wheel-container">
        <div style={{ color: 'white', fontSize: '18px' }}>{error}</div>
      </div>
    );
  }

  if (wheelData.length === 0) {
    return (
      <div className="wheel-container">
        <div style={{ color: 'white', fontSize: '18px' }}>Không có dữ liệu</div>
      </div>
    );
  }

  return (
    <div className="wheel-container">
      {auth && (
        <div className="lw-user-bar">
          <div className="lw-user-bar-left">
            <div className="lw-user-name">{auth.fullName}</div>
            <div className="lw-user-spins">Còn {auth.remainingSpins} lượt</div>
          </div>
          <div className="lw-user-bar-actions">
            <button
              className="lw-history-button"
              onClick={() => void fetchMyHistory()}
              type="button"
              disabled={historyLoading}
            >
              {historyLoading ? '...' : 'Lịch sử'}
            </button>
            <button
              className="lw-logout-button"
              onClick={() => {
                setAuth(null);
                setShowHistoryModal(false);
                setHistoryRows([]);
                setShowCongratsModal(false);
                setWinningPrize(null);
                setShowInfoModal(false);
                setInfoMessage(null);
                setRegisterError(null);
                setShowRegisterModal(false);
                setRegisterForm({
                  fullName: "",
                  invoiceCode: "",
                  phoneNumber: "",
                  totalSpin: 1,
                });
              }}
              type="button"
            >
              Thoát
            </button>
          </div>
        </div>
      )}

      <Wheel
        mustStartSpinning={mustSpin}
        prizeNumber={prizeNumber}
        data={wheelData}
        outerBorderColor={"#fff"}
        outerBorderWidth={10}
        innerBorderColor={"transparent"}
        radiusLineColor={"#fff"}
        radiusLineWidth={1}
        textColors={["#fff"]}
        textDistance={60}
        // @ts-ignore - react-custom-roulette expects arrays for fontSize and fontWeight
        fontSize={[18]}
        // @ts-ignore - react-custom-roulette expects arrays for fontSize and fontWeight
        fontWeight={[500]}
        
        startingOptionIndex={0}
        backgroundColors={backgroundColors}
        onStopSpinning={() => {
          setMustSpin(false);
          // Show congratulation modal with winning prize
          if (winningPrize) setShowCongratsModal(true);
        }}
      />
      <button className="spin-button" onClick={handleSpinClick}>
        {spinLoading ? "..." : "QUAY"}
      </button>

      {/* Register Modal */}
      {showRegisterModal && (
        <div
          className="register-modal-overlay"
          onClick={() => {
            if (!registerLoading) setShowRegisterModal(false);
          }}
        >
          <div className="register-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="register-modal-header">
              <h2>Thông tin người quay</h2>
            </div>

            <div className="register-modal-body">
              <label className="register-label">Họ tên</label>
              <input
                className="register-input"
                value={registerForm.fullName}
                onChange={(e) => setRegisterForm((p) => ({ ...p, fullName: e.target.value }))}
                placeholder="Nhập họ tên"
              />

              <label className="register-label">Mã hóa đơn</label>
              <input
                className="register-input"
                value={registerForm.invoiceCode}
                onChange={(e) => setRegisterForm((p) => ({ ...p, invoiceCode: e.target.value }))}
                placeholder="VD: HD12345"
              />

              <label className="register-label">Số điện thoại</label>
              <input
                className="register-input"
                value={registerForm.phoneNumber}
                onChange={(e) => setRegisterForm((p) => ({ ...p, phoneNumber: e.target.value }))}
                placeholder="VD: 0xxxxxxxxx"
              />

              <label className="register-label">Số lượng vòng quay</label>
              <input
                className="register-input"
                type="number"
                min={1}
                max={2}
                value={registerForm.totalSpin}
                onChange={(e) =>
                  setRegisterForm((p) => {
                    const next = Number(e.target.value || 1);
                    return { ...p, totalSpin: Math.min(2, Math.max(1, next)) };
                  })
                }
                placeholder="VD: 1"
              />

              {registerError && <div className="register-error">{registerError}</div>}
            </div>

            <div className="register-modal-footer">
              <button
                className="register-spin-button"
                onClick={handleRegisterAndSpin}
                disabled={registerLoading || spinLoading || loading}
                type="button"
              >
                {registerLoading ? "Đang xử lý..." : "Lưu thông tin"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Modal */}
      {showInfoModal && (
        <div className="register-modal-overlay" onClick={() => setShowInfoModal(false)}>
          <div className="register-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="register-modal-header">
              <h2>Thông báo</h2>
            </div>
            <div className="register-modal-body">
              <div style={{ fontWeight: 700, color: '#333' }}>{infoMessage || ''}</div>
            </div>
            <div className="register-modal-footer">
              <button
                className="register-spin-button"
                onClick={() => setShowInfoModal(false)}
                type="button"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="register-modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="register-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="register-modal-header">
              <h2>Lịch sử quay</h2>
            </div>
            <div className="register-modal-body">
              {historyRows.length === 0 ? (
                <div style={{ fontWeight: 700, color: '#333' }}>Chưa có lịch sử</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="lw-history-table">
                    <thead>
                      <tr>
                        <th>Thời gian</th>
                        <th>Kết quả</th>
                        <th>Giải thưởng</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyRows.map((r) => (
                        <tr key={r.id}>
                          <td>{r.createdAt ? new Date(r.createdAt).toLocaleString('vi-VN') : '-'}</td>
                          <td>{r.isWin ? 'Trúng' : 'Trượt'}</td>
                          <td>{r.prizeName || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="register-modal-footer">
              <button className="register-spin-button" onClick={() => setShowHistoryModal(false)} type="button">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Congratulation Modal */}
      {showCongratsModal && winningPrize && (
        <div className="congrats-modal-overlay" onClick={() => setShowCongratsModal(false)}>
          <div className="congrats-modal-content" onClick={(e) => e.stopPropagation()}>
            
            <div className="congrats-modal-body">
              {winningPrize.imageUrl && (
                <div className="congrats-prize-image">
                  <img src={winningPrize.imageUrl} alt={winningPrize.name} />
                </div>
              )}
              <h2 className="congrats-prize-name">{winningPrize.name}</h2>
            </div>
            <div className="congrats-modal-footer">
              <button 
                className="congrats-close-button" 
                onClick={() => setShowCongratsModal(false)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
