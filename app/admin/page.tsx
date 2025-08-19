import { SectionCards } from "@/components/sidebar/section-cards";
import { EnrollmentsChart } from "./_components/chart";
import { ChartPieSeparatorNone } from "./_components/PieChart";
import {
  countTotalUsers,
  countUsersWithAtLeastOnePaidEnrollment,
  getCategoryEnrollments,
} from "./actions";

const AdminPage = async () => {
  const data = await getCategoryEnrollments();

  const total = await countTotalUsers();
  const enrolled = await countUsersWithAtLeastOnePaidEnrollment();
  const notEnrolled = total - enrolled;
  return (
    <>
      <SectionCards />
      <div className="px-4 lg:px-6">
        <EnrollmentsChart data={data} />
        <ChartPieSeparatorNone enrolled={enrolled} notEnrolled={notEnrolled} />
      </div>
    </>
  );
};

export default AdminPage;
