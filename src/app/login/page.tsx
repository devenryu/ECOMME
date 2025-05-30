import { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { Suspense } from "react";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Login - E-commerce Landing Page Generator",
  description: "Login to your seller account",
};

// Loading fallback component
function LoginFormSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-10 bg-gray-100 animate-pulse rounded-md"/>
      <div className="h-10 bg-gray-100 animate-pulse rounded-md"/>
      <div className="h-10 bg-primary/30 animate-pulse rounded-md"/>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-zinc-900" />
        <Image
          src="/kogo.png"
          alt="Logo"
          fill
          className="object-cover opacity-70"
          priority
        />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <Link href="/" className="flex items-center space-x-2">
            <span>E-commerce Landing Page Generator</span>
          </Link>
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              Create beautiful landing pages for your products and start selling in minutes.
            </p>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Welcome back
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your email and password to sign in to your account
            </p>
          </div>
          <Suspense fallback={<LoginFormSkeleton />}>
            <LoginForm />
          </Suspense>
          <p className="px-8 text-center text-sm text-muted-foreground">
            By clicking continue, you agree to our{" "}
            <Link
              href="/terms"
              className="underline underline-offset-4 hover:text-primary"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="underline underline-offset-4 hover:text-primary"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
} 