import { useRef, useState } from 'react';
import { Button } from '../shared/Button';
import { uploadImage } from '../../api/uploadApi';

interface MessageInputProps {
  onSend: (content: string) => void;
  onTyping: (isTyping: boolean) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function MessageInput({
  onSend,
  onTyping,
  placeholder = 'Type a message…',
  disabled,
}: MessageInputProps) {
  const [value, setValue] = useState('');
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      onTyping(true);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      onTyping(false);
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const submit = () => {
    if (pendingImageUrl) {
      onSend(pendingImageUrl);
      const trimmed = value.trim();
      if (trimmed) onSend(trimmed);
      setPendingImageUrl(null);
      setValue('');
      return;
    }
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue('');
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (isTypingRef.current) {
      isTypingRef.current = false;
      onTyping(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setIsUploading(true);
    try {
      const url = await uploadImage(file);
      setPendingImageUrl(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const canSend = !disabled && !isUploading && (!!pendingImageUrl || !!value.trim());

  return (
    <div className="message-input-wrap">
      {pendingImageUrl && (
        <div className="image-preview-wrap">
          <img src={pendingImageUrl} className="image-preview" alt="preview" />
          <button
            className="image-preview-remove"
            onClick={() => setPendingImageUrl(null)}
            aria-label="Remove image"
            type="button"
          >
            ×
          </button>
        </div>
      )}
      <div className="message-input-row">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <button
          className="upload-icon-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading || !!pendingImageUrl}
          title="Attach image"
          aria-label="Attach image"
          type="button"
        >
          {isUploading ? (
            <span className="btn-spinner" style={{ borderTopColor: '#888' }} />
          ) : (
            '🖼'
          )}
        </button>
        <textarea
          className="message-input"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={pendingImageUrl ? 'Image ready — press Send' : placeholder}
          disabled={disabled || isUploading}
          rows={1}
        />
        <Button onClick={submit} disabled={!canSend} variant="primary">
          Send
        </Button>
      </div>
    </div>
  );
}
