import { SectionCards } from "@/components/sidebar/section-cards";
import { EnrollmentsChart } from "./_components/chart";
import { ChartPieSeparatorNone } from "./_components/PieChart";
import {
  countTotalUsers,
  countUsersWithAtLeastOnePaidEnrollment,
  getCategoryEnrollments,
} from "./actions";
import { requireAdmin } from "../data/admin/require-admin";
import { prisma } from "@/lib/db";

const AdminPage = async () => {
  const session = await requireAdmin();
  const data = await getCategoryEnrollments();
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

  const dataToRender =
    session.user.email === "a.lebkara@esi-sba.dz" ? data : finalData;
  return (
    <>
      <SectionCards email={session.user.email} />
      <div className="px-4 lg:px-6">
        <EnrollmentsChart data={dataToRender} />
        <ChartPieSeparatorNone enrolled={enrolled} notEnrolled={notEnrolled} />
      </div>
    </>
  );
};

export default AdminPage;
