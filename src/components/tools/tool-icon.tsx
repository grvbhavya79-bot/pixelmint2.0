"use client";

import {
  AlertTriangle, AlignLeft, Archive, ArrowDownAZ, ArrowLeftRight, ArrowRightLeft, Binary, Braces,
  Brackets, Calculator, Cake, CalendarRange, CaseUpper, CircleDollarSign, Clock, Code2, Code,
  Contrast, Crop, Database, Dices, Droplet, Droplets, Eraser, FileCode, FileCode2, FileDigit,
  FileImage, FileMinus, FileOutput, FilePlus2, FileSearch, FileStack, FileText, FileType, FileType2,
  FileX, Files, FileQuestion, FlipHorizontal, Focus, FolderArchive, FolderDown, Fingerprint, Globe,
  Hash, HardDrive, HeartPulse, Image as ImageIcon, ImageDown, Images, IndentIncrease, Info, KeyRound,
  Landmark, Layers, Link, Link2, ListFilter, Lock, Minimize, Minimize2, MonitorPlay,
  Package, Paintbrush, Palette, PenLine, Percent, Pipette, Presentation, QrCode, Receipt, Regex,
  RemoveFormatting, ReceiptIndianRupee, Ruler, Scaling, ScanLine, Scissors, Scaling as ScalingIcon,
  Sheet, ShieldCheck, Shrink, SlidersHorizontal, SquarePen, Table, Tag, TextCursorInput, Timer,
  Type, Unlock, Wand2, WholeWord, Wrench, Zap, RotateCw, RotateCcw, Type as TypeIcon,
  Layers3, Wrench as WrenchIcon, FolderOutput, FileJson, Boxes,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  AlertTriangle, AlignLeft, Archive, ArrowDownAZ, ArrowLeftRight, ArrowRightLeft, Binary, Braces,
  Brackets, Calculator, Cake, CalendarRange, CaseUpper, CircleDollarSign, Clock, Code2, Code,
  Contrast, Crop, Database, Dices, Droplet, Droplets, Eraser, FileCode, FileCode2, FileDigit,
  FileImage, FileMinus, FileOutput, FilePlus2, FileSearch, FileStack, FileText, FileType, FileType2,
  FileX, Files, FileQuestion, FlipHorizontal, Focus, FolderArchive, FolderDown, Fingerprint, Globe,
  Hash, HardDrive, HeartPulse, Image: ImageIcon, ImageDown, Images, IndentIncrease, Info, KeyRound,
  Landmark, Layers, Link, Link2, ListFilter, Lock, Minimize, Minimize2, MonitorPlay,
  Package, Paintbrush, Palette, PenLine, Percent, Pipette, Presentation, QrCode, Receipt, Regex,
  RemoveFormatting, Ruler, Scaling, ScanLine, Scissors, Sheet, ShieldCheck, Shrink, SlidersHorizontal,
  SquarePen, Table, Tag, TextCursorInput, Timer, Type, Unlock, Wand2, WholeWord, Wrench, Zap,
  RotateCw, RotateCcw, Layers3, FolderOutput, FileJson, Boxes,
};

export function ToolIcon({
  name,
  className,
  size = 18,
}: {
  name: string;
  className?: string;
  size?: number;
}) {
  const Icon = ICONS[name] ?? FileText;
  return <Icon className={cn("shrink-0", className)} size={size} aria-hidden="true" />;
}

export { ICONS as LUCIDE_ICONS };
