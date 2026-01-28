"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar, BookOpen, Settings } from "lucide-react";
import { AdminGuard } from "@/components/admin-guard";

export default function AdminPage() {
  const router = useRouter();

  return (
    <AdminGuard>
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 max-w-6xl">
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 md:mb-8">
          <Settings className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-primary" />
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">
            Admin Dashboard
          </h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => router.push("/admin/sessions")}
          >
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl md:text-2xl">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6" />
                Manage Sessions
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Create and manage tutoring and group sessions.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <Button className="w-full text-sm sm:text-base" size="lg">
                Go to Sessions
              </Button>
            </CardContent>
          </Card>

          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => router.push("/admin/resources")}
          >
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl md:text-2xl">
                <BookOpen className="h-5 w-5 sm:h-6 sm:w-6" />
                Manage Resources
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Create and manage learning resources for students.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <Button className="w-full text-sm sm:text-base" size="lg">
                Go to Resources
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminGuard>
  );
}
