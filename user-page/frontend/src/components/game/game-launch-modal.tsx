'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, Loader2, ExternalLink } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useLoginModalStore } from '@/stores/login-modal-store';
import { useGameStore, type Game } from '@/stores/game-store';
import { getProviderImage } from '@/lib/provider-images';

interface GameLaunchModalProps {
  game: Game | null;
  onClose: () => void;
}

export function GameLaunchModal({ game, onClose }: GameLaunchModalProps) {
  const { isAuthenticated } = useAuthStore();
  const { open: openLogin } = useLoginModalStore();
  const { launchGame, launchDemo, isLaunching } = useGameStore();
  const [error, setError] = useState('');
  const [gameImgError, setGameImgError] = useState(false);
  const [logoError, setLogoError] = useState(false);

  if (!game) return null;

  const logoSrc = getProviderImage(game.provider, game.providerName);
  const hasGameImage = game.image && !gameImgError;

  const openGameWindow = () => {
    const w = window.open('', '_blank');
    if (w) {
      const doc = w.document;
      doc.open();
      const html = doc.createElement('html');
      const head = doc.createElement('head');
      const meta = doc.createElement('meta');
      meta.setAttribute('charset', 'utf-8');
      head.appendChild(meta);
      const style = doc.createElement('style');
      style.textContent = '*{margin:0;padding:0;box-sizing:border-box}body{background:#0f0f23;display:flex;align-items:center;justify-content:center;height:100vh;font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:#fff}.c{text-align:center}.s{width:40px;height:40px;border:3px solid #333;border-top-color:#feb614;border-radius:50%;animation:r .8s linear infinite;margin:0 auto 16px}@keyframes r{to{transform:rotate(360deg)}}p{color:#98a7b5;font-size:14px}';
      head.appendChild(style);
      html.appendChild(head);
      const body = doc.createElement('body');
      const container = doc.createElement('div');
      container.className = 'c';
      const spinner = doc.createElement('div');
      spinner.className = 's';
      container.appendChild(spinner);
      const text = doc.createElement('p');
      text.textContent = '게임 로딩 중...';
      container.appendChild(text);
      body.appendChild(container);
      html.appendChild(body);
      doc.appendChild(html);
      doc.close();
    }
    return w;
  };

  const isValidGameUrl = (url: string): boolean => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'https:' || parsed.protocol === 'http:';
    } catch {
      return false;
    }
  };

  const handlePlay = async () => {
    if (!isAuthenticated) {
      onClose();
      openLogin();
      return;
    }
    setError('');
    const gameWindow = openGameWindow();
    onClose();
    try {
      const isMobile = window.innerWidth < 768;
      const url = await launchGame(game.uid, isMobile ? 2 : 1);
      if (!isValidGameUrl(url)) {
        throw new Error('유효하지 않은 게임 URL입니다');
      }
      if (gameWindow && !gameWindow.closed) {
        gameWindow.location.href = url;
      } else {
        window.location.href = url;
      }
    } catch (err) {
      if (gameWindow && !gameWindow.closed) gameWindow.close();
      setError(err instanceof Error ? err.message : '게임 실행에 실패했습니다');
    }
  };

  const handleDemo = async () => {
    setError('');
    const gameWindow = openGameWindow();
    onClose();
    try {
      const isMobile = window.innerWidth < 768;
      const url = await launchDemo(game.uid, isMobile ? 2 : 1);
      if (!isValidGameUrl(url)) {
        throw new Error('유효하지 않은 게임 URL입니다');
      }
      if (gameWindow && !gameWindow.closed) {
        gameWindow.location.href = url;
      } else {
        window.location.href = url;
      }
    } catch (err) {
      if (gameWindow && !gameWindow.closed) gameWindow.close();
      setError(err instanceof Error ? err.message : '데모 게임 실행에 실패했습니다');
    }
  };

  const hue = game.name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="relative w-full max-w-[400px] overflow-hidden rounded-[16px] bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
        >
          <X className="size-4" />
        </button>

        {/* Game Preview */}
        <div
          className="relative flex h-[180px] flex-col items-center justify-center gap-3 overflow-hidden"
          style={{
            background: hasGameImage
              ? '#1a1a2e'
              : `linear-gradient(135deg, hsl(${hue}, 60%, 45%), hsl(${(hue + 40) % 360}, 70%, 35%))`,
          }}
        >
          {hasGameImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={game.image}
              alt={game.name}
              className="absolute inset-0 w-full h-full object-cover"
              onError={() => setGameImgError(true)}
            />
          ) : (
            <>
              {logoSrc && !logoError ? (
                <Image
                  src={logoSrc}
                  alt={game.providerName}
                  width={72}
                  height={72}
                  className="object-contain drop-shadow-lg"
                  onError={() => setLogoError(true)}
                />
              ) : null}
              <span className="text-white text-[20px] font-bold text-center px-6">{game.name}</span>
            </>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="text-[18px] font-bold text-[#252531]">{game.name}</h3>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-[13px] text-[#98a7b5]">{game.providerName}</span>
            <span className="rounded-full bg-[#f1f2f7] px-2 py-0.5 text-[10px] font-semibold text-[#6b7280]">
              {game.type}
            </span>
          </div>

          {error && (
            <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-600">
              {error}
            </div>
          )}

          <div className="mt-5 flex gap-3">
            <button
              onClick={handleDemo}
              disabled={isLaunching}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-[10px] border border-[#e8e8e8] py-3 text-[14px] font-bold text-[#6b7280] transition-colors hover:border-[#feb614] hover:text-[#feb614] disabled:opacity-50"
            >
              {isLaunching ? <Loader2 className="size-4 animate-spin" /> : <ExternalLink className="size-4" />}
              Demo
            </button>
            <button
              onClick={handlePlay}
              disabled={isLaunching}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-[10px] bg-[#feb614] py-3 text-[14px] font-bold text-[#252531] transition-all hover:brightness-110 disabled:opacity-50"
            >
              {isLaunching ? <Loader2 className="size-4 animate-spin" /> : null}
              {isAuthenticated ? 'Real Play' : 'Login to Play'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
