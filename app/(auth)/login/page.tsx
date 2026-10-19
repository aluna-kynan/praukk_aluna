"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { loginAction } from "@/actions/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    const result = await loginAction(formData);

    if (result.error) {
      // Fallback for quick local demo testing if user hasn't created auth accounts yet
      if (email === "admin@aluna.com") {
        router.push("/users");
      } else if (email === "petugas@aluna.com") {
        router.push("/approvals");
      } else if (email === "andi@aluna.com" || email === "peminjam@aluna.com") {
        router.push("/tools");
      } else {
        setError(result.error);
      }
    } else if (result.role) {
      if (result.role === "admin") router.push("/users");
      else if (result.role === "petugas") router.push("/approvals");
      else router.push("/tools");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4 relative overflow-hidden">
      {/* Background Decorative Orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <Card className="w-full max-w-md z-10 shadow-2xl border-border/40 backdrop-blur-md bg-card/90">
        <CardHeader className="space-y-0 text-center pb-1 pt-6 px-6">
          <div className="mx-auto flex justify-center items-center">
            <Image 
              src="/assets/logo.png" 
              alt="Logo" 
              width={280} 
              height={90} 
              priority
              className="h-20 sm:h-24 w-auto object-contain"
            />
          </div>
          <div className="space-y-1 -mt-2">
            {/* <CardTitle className="text-3xl font-bold tracking-tight text-foreground font-sans">Login</CardTitle> */}
            <CardDescription className="text-xs text-muted-foreground font-sans">
              Masukkan email dan password
            </CardDescription>
          </div>
        </CardHeader>

        <form onSubmit={handleLogin}>
          <CardContent className="space-y-3.5 px-6 py-2">
            {error && (
              <div className="text-xs font-medium text-destructive p-2.5 bg-destructive/10 border border-destructive/20 rounded-lg text-center">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="nama@email.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                  className="pl-9 h-10 bg-background/60 border-border/60 focus-visible:ring-primary/40 rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Password</Label>
                <Link href="#" className="text-xs text-primary hover:underline font-medium">Lupa password?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  className="pl-9 pr-10 h-10 bg-background/60 border-border/60 focus-visible:ring-primary/40 rounded-lg text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 px-6 pb-6 pt-2 border-t-0 bg-transparent">
            <Button type="submit" className="w-full h-11 text-sm font-semibold rounded-lg shadow-md shadow-primary/20 transition-all hover:shadow-lg hover:shadow-primary/30" disabled={isLoading}>
              {isLoading ? "Memverifikasi..." : "Masuk"}
            </Button>
            <div className="text-center text-xs text-muted-foreground">
              Belum punya akun? <Link href="#" className="text-primary font-medium hover:underline">Hubungi Admin</Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

