"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Navbar } from "@/components/Navbar";
import { Clock } from "lucide-react";

export default function GenerateContent() {
  return (
    <div className="bg-gradient-to-br from-gray-900 to-black min-h-screen text-white">
      <Navbar />
      <div className="container mx-auto px-4 mb-8 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 mt-14 lg:grid-cols-3 gap-8">
          {/* Left sidebar - History */}
          <div className="lg:col-span-1 bg-gray-800 rounded-2xl p-6 h-[calc(100vh-12rem)] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-blue-400">History</h2>
              <Clock className="h-6 w-6 text-blue-400" />
            </div>
            <div className="space-y-4">{/**Generate history */}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
