import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  // Fetch full user data including pets/records
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      pets: {
        include: {
          medicalRecords: {
            include: { vet: true }
          },
          ownerReports: true,
          validatedBy: true
        }
      },
      medicalRecords: true,
    }
  });

  if (!user) {
    redirect("/");
  }

  // Remove passwordHash before passing to client
  const { passwordHash, ...safeUser } = user;

  return <DashboardClient user={safeUser} />;
}
