"use client"

import { useState } from "react"
import { Download, Check, FileArchive, Shield, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ImageDownloadProps {
  imageName: string
  imageSize: string
  onDownload: () => void
}

export function ImageDownload({ imageName, imageSize, onDownload }: ImageDownloadProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadComplete, setDownloadComplete] = useState(false)

  const handleDownload = () => {
    setIsDownloading(true)
    
    // Simulate download
    setTimeout(() => {
      setIsDownloading(false)
      setDownloadComplete(true)
      onDownload()
    }, 2000)
  }

  return (
    <div className="my-6 p-6 rounded-xl border-2 border-primary bg-primary/5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center">
          <FileArchive className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Your Image is Ready</h3>
          <p className="text-sm text-muted-foreground">{imageName}.ova</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6 py-4 border-y border-border">
        <div className="text-center">
          <div className="text-lg font-semibold text-foreground">{imageSize}</div>
          <div className="text-xs text-muted-foreground">File Size</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-lg font-semibold text-foreground">Verified</span>
          </div>
          <div className="text-xs text-muted-foreground">Checksum</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-lg font-semibold text-foreground">30 days</span>
          </div>
          <div className="text-xs text-muted-foreground">Available</div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={handleDownload}
          disabled={isDownloading || downloadComplete}
          className="flex-1 gap-2"
          size="lg"
        >
          {downloadComplete ? (
            <>
              <Check className="w-5 h-5" />
              Downloaded
            </>
          ) : isDownloading ? (
            <>
              <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              Downloading...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Download OVA
            </>
          )}
        </Button>
        <Button variant="outline" size="lg" className="gap-2">
          <FileArchive className="w-5 h-5" />
          View in Library
        </Button>
      </div>

      {downloadComplete && (
        <p className="mt-4 text-sm text-center text-muted-foreground">
          Your image has been downloaded. You can also access it anytime from the Image Library.
        </p>
      )}
    </div>
  )
}
