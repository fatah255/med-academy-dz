import { SectionCards } from "@/components/sidebar/section-cards";
import { EnrollmentsChart } from "./_components/chart";
import { ChartPieSeparatorNone } from "./_components/PieChart";
import {
  countTotalUsers,
  countUsersWithAtLeastOnePaidEnrollment,
  getCourseEnrollments,
} from "./actions";
import { requireAdmin } from "../data/admin/require-admin";
import { prisma } from "@/lib/db";
import { isOwnersEmail } from "@/lib/utils";
import { EnrollmentTable } from "@/components/admin/EnrollmentTable";

const AdminPage = async () => {
  const session = await requireAdmin();
  const data = await getCourseEnrollments();

  const userId = session.user.id;
  const userCoursesCategories = await prisma.course.findMany({
    where: { userId },
    select: { category: true },
  });

  const userCategories = userCoursesCategories.map((c) => c.category);

  const finalData = data.filter((item) => userCategories.includes(item.course));

  const total = await countTotalUsers();
  const enrolled = await countUsersWithAtLeastOnePaidEnrollment();
  const notEnrolled = total - enrolled;

  const dataToRender = isOwnersEmail(session.user.email || "")
    ? data
    : finalData;
  const enrollments = await prisma.enrollment.findMany({
    where: { status: "PAID", courseId: { not: null } },
    select: {
      id: true,
      amount: true,
      status: true,
      transactionId: true,
      offer: true,
      isOffer: true,
      ai: true,
      billingPeriod: true,
      createdAt: true,
      paidAt: true,
      expiresAt: true,
      user: { select: { name: true, email: true } },
      course: { select: { title: true, slug: true } },
      quiz: { select: { title: true } },
    },
    orderBy: { paidAt: "desc" }, // optional but handy
  });

  return (
    <>
      <SectionCards email={session.user.email} />
      <div className="px-4 lg:px-6">
        <EnrollmentsChart data={dataToRender} />
        <ChartPieSeparatorNone enrolled={enrolled} notEnrolled={notEnrolled} />
        {/* <EnrollmentTable enrollments={enrollments} /> */}
      </div>
    </>
  );
};

export default AdminPage;
