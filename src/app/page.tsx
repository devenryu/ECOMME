import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Create Beautiful Landing Pages
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  Generate stunning e-commerce landing pages in minutes. No coding required.
                </p>
              </div>
              <div className="space-x-4">
                <Link href="/login">
                  <Button size="lg" className="bg-primary text-primary-foreground">
                    Get Started
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline" size="lg">
                    View Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-800">
          <div className="container px-4 md:px-6">
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Easy to Use</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Create professional landing pages with our intuitive drag-and-drop interface.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Customizable</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Choose from multiple templates and customize them to match your brand.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Mobile Responsive</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  All landing pages are fully responsive and look great on any device.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="w-full border-t border-gray-200 dark:border-gray-800">
        <div className="container flex flex-col gap-2 py-10 px-4 md:px-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-gray-500 dark:text-gray-400">
              © 2024 E-commerce Landing Page Generator. All rights reserved.
            </p>
            <nav className="flex gap-4">
              <Link href="/terms" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50">
                Terms
              </Link>
              <Link href="/privacy" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50">
                Privacy
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
