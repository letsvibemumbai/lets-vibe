import { getMembershipConfig, listMemberships } from "@/lib/db/membership.server";
import { MembershipAdmin } from "@/components/admin/membership/MembershipAdmin";

export const metadata = { title: "Membership · Admin" };

export default async function AdminMembershipPage() {
  const [config, members] = await Promise.all([
    getMembershipConfig(),
    listMemberships(),
  ]);

  return <MembershipAdmin config={config} members={members} />;
}
