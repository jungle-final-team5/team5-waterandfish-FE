import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import API from '@/components/AxiosInstance';

interface VideoUploadModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (videoData: {
    file: File;
    label: string;
    description?: string;
  }) => void;
}

export const VideoUploadModal = ({ open, onClose, onSave }: VideoUploadModalProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('video/')) {
      toast({
        title: "잘못된 파일 형식",
        description: "비디오 파일만 업로드할 수 있습니다.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile || !label.trim()) {
      toast({
        title: "필수 정보 누락",
        description: "파일과 라벨을 모두 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("label", label.trim());
    formData.append("video", selectedFile);

    try {
      await API.post("/upload-sign-video", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast({
        title: "업로드 성공",
        description: "영상이 성공적으로 업로드되었습니다.",
        variant: "default",
      });
      // Reset form and close modal
      setSelectedFile(null);
      setLabel('');
      setDescription('');
      onClose();
    } catch (e: any) {
      toast({
        title: "업로드 실패",
        description: e?.response?.data?.detail || e.message || "업로드 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setLabel('');
    setDescription('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>수어 영상 업로드</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Upload Area */}
          <div className="space-y-2">
            <Label>영상 파일</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
                dragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {selectedFile ? (
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Upload className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-600">파일 선택됨</span>
                  </div>
                  <p className="text-sm text-gray-600">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">
                    크기: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => setSelectedFile(null)}
                  >
                    <X className="h-4 w-4 mr-2" />
                    제거
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 mb-2">
                    드래그 앤 드롭하거나 클릭하여 파일을 선택하세요
                  </p>
                  <Input
                    type="file"
                    accept="video/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileSelect(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                    id="video-upload"
                  />
                  <Label
                    htmlFor="video-upload"
                    className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                  >
                    파일 선택
                  </Label>
                  <p className="text-xs text-gray-500 mt-2">
                    지원 형식: MP4, AVI, MOV, WMV
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Label Input */}
          <div className="space-y-2">
            <Label htmlFor="label">수어 라벨 *</Label>
            <Input
              id="label"
              placeholder="예: 안녕하세요, 감사합니다, 사랑해요"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              이 영상이 어떤 수어를 나타내는지 입력해주세요
            </p>
          </div>

          {/* Description Input */}
          <div className="space-y-2">
            <Label htmlFor="description">설명 (선택사항)</Label>
            <Textarea
              id="description"
              placeholder="추가적인 설명이나 메모를 입력하세요"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleClose}>
              취소
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!selectedFile || !label.trim()}
            >
              업로드
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};