import React, { useRef, useEffect, useState } from 'react';
import { CellData, isCellCompleted } from '@/lib/game-utils';
import { Check, Lock, Gift, Star, ShoppingCart, Users } from 'lucide-react';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';

interface BingoCellProps {
  cell: CellData;
  completedCells: number[];
  purchasedCells: number[];
  referralCells: number[];
  onMark: (index: number) => void;
  onPurchase: (index: number) => void;
  locked?: boolean;
  prizeImageUrl?: string;
  progress?: number;
  onProgressChange?: (index: number, newProgress: number) => void;
  onUnmark?: (index: number) => void;
}

const BingoCell: React.FC<BingoCellProps> = ({
  cell,
  completedCells,
  purchasedCells,
  referralCells,
  onMark,
  onPurchase,
  locked = false,
  prizeImageUrl,
  progress = 0,
  onProgressChange,
  onUnmark,
}) => {
  const [pendingConfirm, setPendingConfirm] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const isCompleted = isCellCompleted(
    cell.index,
    completedCells,
    purchasedCells,
    referralCells,
    cell.is_free_space
  );
  const isPurchased = purchasedCells.includes(cell.index);
  const isReferralFree = referralCells.includes(cell.index);

  // Cancel on Escape key
  useEffect(() => {
    if (!pendingConfirm) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setPendingConfirm(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [pendingConfirm]);

  // Cancel when user clicks/touches outside this cell
  useEffect(() => {
    if (!pendingConfirm) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        setPendingConfirm(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [pendingConfirm]);

  const qty = cell.quantity ?? 1;

  const handleConfirm = () => {
    if (isCompleted) {
      onUnmark?.(cell.index);
    } else if (progress + 1 >= qty) {
      onMark(cell.index);
      onProgressChange?.(cell.index, 0);
    } else {
      onProgressChange?.(cell.index, progress + 1);
    }
    setPendingConfirm(false);
  };

  const handleClick = () => {
    if (locked) return;
    if (cell.is_free_space) return;
    if (cell.is_purchasable && !isPurchased) {
      onPurchase(cell.index);
      return;
    }
    if (cell.is_purchasable && isPurchased) return;
    if (cell.is_referral_free) return;
    // Revealed secret squares cannot be unmarked (wallet credit already paid out)
    if (cell.is_secret && cell.secret_revealed) return;
    setPendingConfirm(true);
  };

  // --- Determine visual state ---
  const isFree = cell.is_free_space;
  const needsPurchase = cell.is_purchasable && !isPurchased;
  const needsReferral = cell.is_referral_free && !isReferralFree && !isCompleted;
  const isRegularDeed = !isFree && !cell.is_purchasable && !cell.is_referral_free;

  const shouldShowHoverCard =
    !pendingConfirm &&
    !isFree &&
    !cell.is_purchasable &&
    !cell.is_referral_free &&
    Boolean(cell.deed_text_long && cell.deed_text_long.trim());

  const buttonEl = (
    <button
      ref={buttonRef}
      onClick={handleClick}
      disabled={locked || isFree || cell.is_referral_free || (cell.is_purchasable && isPurchased)}
      aria-label={
        isFree
          ? 'Free space'
          : needsPurchase
            ? `Buy this square for $${cell.purchase_price}`
            : cell.is_referral_free
              ? 'Refer a Player'
              : cell.deed_text
      }
      title={shouldShowHoverCard ? (cell.deed_text_long as string) : undefined}
      className={`
        relative flex flex-col items-center justify-center
        w-full h-full
        transition-all duration-200 ease-out
        overflow-hidden select-none
        ${locked && !isCompleted && !isFree ? 'opacity-50 grayscale cursor-not-allowed' : ''}
        ${isFree
          ? prizeImageUrl
            ? 'cursor-default'
            : 'bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-400 cursor-default'
          : isCompleted
            ? `bg-gradient-to-br from-emerald-400 to-green-500 ${
                isRegularDeed ? 'cursor-pointer hover:from-emerald-500 hover:to-green-600' : 'cursor-default'
              }`
            : needsPurchase
              ? 'bg-gradient-to-br from-amber-50 via-amber-100 to-yellow-100 hover:from-amber-100 hover:to-yellow-200 cursor-pointer border border-amber-300/50'
              : needsReferral
                ? 'bg-gradient-to-br from-teal-50 to-cyan-100 cursor-default border border-teal-300/50'
                : 'bg-white hover:bg-indigo-50 cursor-pointer active:bg-indigo-100'
        }
      `}
    >
      {/* ===== CONFIRMATION OVERLAY ===== */}
      {pendingConfirm && (
        <div
          className="absolute inset-0 z-10 bg-indigo-950/95 flex flex-col items-center justify-center gap-1.5 p-1 rounded"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <p className="text-[7px] sm:text-[9px] font-black text-white uppercase tracking-wide text-center leading-tight">
            {isCompleted ? 'UNMARK?' : 'MARK SQUARE?'}
          </p>
          <div className="flex gap-2">
            <div
              role="button"
              tabIndex={0}
              className="flex items-center justify-center w-9 sm:w-11 h-7 sm:h-8 bg-emerald-500 active:bg-emerald-400 rounded-md text-white font-black text-sm sm:text-base cursor-pointer select-none"
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleConfirm(); }}
              onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); handleConfirm(); }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleConfirm(); }}
            >
              ✓
            </div>
            <div
              role="button"
              tabIndex={0}
              className="flex items-center justify-center w-9 sm:w-11 h-7 sm:h-8 bg-rose-600/80 active:bg-rose-500 rounded-md text-white font-black text-sm sm:text-base cursor-pointer select-none"
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setPendingConfirm(false); }}
              onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); setPendingConfirm(false); }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setPendingConfirm(false); }}
            >
              ✕
            </div>
          </div>
        </div>
      )}

      {/* ===== FREE SPACE ===== */}
      {isFree && (
        <>
          {prizeImageUrl ? (
            <img
              src={prizeImageUrl}
              alt="Prize — free square"
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-0.5">
              <Star className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white drop-shadow-md fill-white/80" />
              <span className="text-[9px] sm:text-xs md:text-sm font-black text-white uppercase tracking-widest drop-shadow-sm">
                FREE
              </span>
            </div>
          )}
        </>
      )}

      {/* ===== COMPLETED CELL (marked, purchased, or referral) ===== */}
      {!isFree && isCompleted && (
        <div className="flex flex-col items-center justify-center gap-0.5 px-1">
          <div className="bg-white/30 rounded-full p-1 sm:p-1.5 mb-0.5">
            <Check className="w-4 h-4 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white drop-shadow" strokeWidth={3} />
          </div>
          {/* Purchasable completed */}
          {cell.is_purchasable && (
            <span className="text-[8px] sm:text-[10px] font-bold text-white/90 drop-shadow-sm">
              Purchased ✓
            </span>
          )}
          {/* Referral completed */}
          {cell.is_referral_free && !cell.is_purchasable && (
            <span className="text-[8px] sm:text-[10px] font-bold text-white/90 drop-shadow-sm">
              Referred ✓
            </span>
          )}
          {/* Regular deed completed */}
          {!cell.is_purchasable && !cell.is_referral_free && (
            <>
              <span className="text-[7px] sm:text-[9px] md:text-[10px] text-center leading-tight font-bold text-white/90 line-clamp-2 px-0.5 drop-shadow-sm">
                {cell.deed_text}
              </span>
              {qty > 1 && (
                <div className="flex gap-0.5 mt-0.5">
                  {Array.from({ length: qty }).map((_, i) => (
                    <span key={i} className="text-[8px] sm:text-[10px] text-white/80">●</span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ===== PURCHASABLE (NOT YET PURCHASED) — No deed, just buy prompt ===== */}
      {!isFree && !isCompleted && needsPurchase && (
        <div className="flex flex-col items-center justify-center gap-1 px-1 w-full h-full">
          <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
          <span className="text-[8px] sm:text-[10px] md:text-xs font-bold text-amber-800 text-center leading-tight">
            Buy this Square
          </span>
          <div className="flex items-center gap-0.5 bg-amber-500 text-white rounded-full px-2 sm:px-2.5 py-0.5 shadow-md mt-0.5">
            <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            <span className="text-[9px] sm:text-[11px] md:text-xs font-black">
              ${cell.purchase_price}
            </span>
          </div>
        </div>
      )}

      {/* ===== REFERRAL (NOT YET EARNED) — "Refer a Player" prompt ===== */}
      {!isFree && !isCompleted && !needsPurchase && needsReferral && (
        <div className="flex flex-col items-center justify-center gap-1 px-1">
          <Users className="w-5 h-5 sm:w-6 sm:h-6 text-teal-500" />
          <span className="text-[8px] sm:text-[10px] md:text-xs font-bold text-teal-700 text-center leading-tight">
            Refer a Player
          </span>
          <Gift className="w-3 h-3 sm:w-4 sm:h-4 text-teal-400 mt-0.5" />
        </div>
      )}

      {/* ===== REGULAR DEED ===== */}
      {!isFree && !isCompleted && !needsPurchase && !needsReferral && (
        <div className="flex flex-col items-center justify-center px-1.5 sm:px-2">
          <span className={`text-[8px] sm:text-[10px] md:text-[11px] text-center leading-snug font-semibold text-slate-700 ${qty > 1 ? 'line-clamp-3' : 'line-clamp-4'}`}>
            {cell.deed_text}
          </span>
          {qty > 1 && (
            <div className="flex flex-col items-center gap-0.5 mt-0.5">
              <div className="flex gap-0.5">
                {Array.from({ length: qty }).map((_, i) => (
                  <span key={i} className={`text-[8px] sm:text-[10px] ${i < progress ? 'text-emerald-500' : 'text-slate-300'}`}>
                    {i < progress ? '●' : '○'}
                  </span>
                ))}
              </div>
              <span className="text-[7px] sm:text-[9px] text-slate-400">
                {progress} / {qty}
              </span>
            </div>
          )}
        </div>
      )}
    </button>
  );

  // Wrap in HoverCard so users see the long-form description on hover.
  if (!shouldShowHoverCard) {
    return buttonEl;
  }

  return (
    <HoverCard openDelay={180} closeDelay={80}>
      <HoverCardTrigger asChild>{buttonEl}</HoverCardTrigger>
      <HoverCardContent
        side="top"
        align="center"
        className="w-72 sm:w-80 max-w-[90vw]"
      >
        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-slate-900 leading-snug">
            {cell.deed_text}
          </p>
          <p className="text-xs text-slate-600 leading-relaxed">
            {cell.deed_text_long}
          </p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export default BingoCell;
