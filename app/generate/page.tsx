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
import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import { Clock, Instagram, Linkedin, Twitter, Upload, Zap } from "lucide-react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const contentTypes = [
  { value: "twitter", label: "Twitter Thread" },
  { value: "instagram", label: "Instagram Caption" },
  { value: "linkedin", label: "LinkedIn Post" },
];

const MAX_TWEET_LENGTH = 280;
const POINTS_PER_GENERATION = 5;

export default function GenerateContent() {
  const { isLoaded, isSignedIn, user } = useUser();

  const [contentType, setContentType] = useState(contentTypes[0].value);
  const [prompt, setPrompt] = useState("");
  const [userPoints, setUserPoints] = useState<number | null>(null);
  const [image, setImage] = useState<File | null>(null);

    const handleGenerate = async () => {
      if (
        !genAI ||
        !user?.id ||
        userPoints === null ||
        userPoints < POINTS_PER_GENERATION
      ) {
        alert("Not enough points or API key not set.");
        return;
      }

      setIsLoading(true);
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        let promptText = `Generate ${contentType} content about "${prompt}".`;
        if (contentType === "twitter") {
          promptText +=
            " Provide a thread of 5 tweets, each under 280 characters.";
        }

        let imagePart: Part | null = null;
        if (contentType === "instagram" && image) {
          const reader = new FileReader();
          const imageData = await new Promise<string>((resolve) => {
            reader.onload = (e) => {
              if (e.target && typeof e.target.result === "string") {
                resolve(e.target.result);
              } else {
                resolve("");
              }
            };
            reader.readAsDataURL(image);
          });

          const base64Data = imageData.split(",")[1];
          if (base64Data) {
            imagePart = {
              inlineData: {
                data: base64Data,
                mimeType: image.type,
              },
            };
          }
          promptText +=
            " Describe the image and incorporate it into the caption.";
        }

        const parts: (string | Part)[] = [promptText];
        if (imagePart) parts.push(imagePart);

        const result = await model.generateContent(parts);
        const generatedText = result.response.text();

        let content: string[];
        if (contentType === "twitter") {
          content = generatedText
            .split("\n\n")
            .filter((tweet) => tweet.trim() !== "");
        } else {
          content = [generatedText];
        }

        setGeneratedContent(content);

        // Update points
        const updatedUser = await updateUserPoints(
          user.id,
          -POINTS_PER_GENERATION
        );
        if (updatedUser) {
          setUserPoints(updatedUser.points);
        }

        // Save generated content
        const savedContent = await saveGeneratedContent(
          user.id,
          content.join("\n\n"),
          prompt,
          contentType
        );

        if (savedContent) {
          setHistory((prevHistory) => [savedContent, ...prevHistory]);
        }
      } catch (error) {
        console.error("Error generating content:", error);
        setGeneratedContent(["An error occurred while generating content."]);
      } finally {
        setIsLoading(false);
      }
    };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setImage(event.target.files[0]);
    }
  };

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

        {/* Main content area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Points display */}
          <div className="bg-gray-800 p-6 rounded-2xl flex items-center justify-between">
            <div className="flex items-center">
              <Zap className="h-8 w-8 text-yellow-400 mr-3" />
              <div>
                <p className="text-sm text-gray-400">Available Points</p>
                <p className="text-2xl font-bold text-yellow-400">0</p>
              </div>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-4 rounded-full transition-colors">
              <Link href="/pricing">Get More Points</Link>
            </Button>
          </div>

          {/* Content generation form */}
          <div className="bg-gray-800 p-6 rounded-2xl space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Content Type
              </label>
              <Select onValueChange={setContentType} defaultValue={contentType}>
                <SelectTrigger className="w-full bg-gray-700 border-none rounded-xl">
                  <SelectValue placeholder="Select content type" />
                </SelectTrigger>
                <SelectContent>
                  {contentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center">
                        {type.value === "twitter" && (
                          <Twitter className="mr-2 h-4 w-4 text-blue-400" />
                        )}
                        {type.value === "instagram" && (
                          <Instagram className="mr-2 h-4 w-4 text-pink-400" />
                        )}
                        {type.value === "linkedin" && (
                          <Linkedin className="mr-2 h-4 w-4 text-blue-600" />
                        )}
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label
                htmlFor="prompt"
                className="block text-sm font-medium mb-2 text-gray-300"
              >
                Prompt
              </label>
              <Textarea
                id="prompt"
                placeholder="Enter your prompt here..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className="w-full bg-gray-700 border-none rounded-xl resize-none"
              />
            </div>

            {contentType === "instagram" && (
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Upload Image
                </label>
                <div className="flex items-center space-x-3">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer flex items-center justify-center px-4 py-2 bg-gray-700 rounded-xl text-sm font-medium hover:bg-gray-600 transition-colors"
                  >
                    <Upload className="mr-2 h-5 w-5" />
                    <span>Upload Image</span>
                  </label>
                  {image && (
                    <span className="text-sm text-gray-400">{image.name}</span>
                  )}
                </div>
              </div>
            )}

            <Button
              onClick={handleGenerate}
              disabled={
                isLoading ||
                !prompt ||
                userPoints === null ||
                userPoints < POINTS_PER_GENERATION
              }
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating...
                </>
              ) : (
                `Generate Content (${POINTS_PER_GENERATION} points)`
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
