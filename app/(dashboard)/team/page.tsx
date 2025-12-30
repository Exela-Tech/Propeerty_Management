import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Plus } from "lucide-react"
import { getTeamMembers } from "./actions"
import { TeamMemberActionButtons } from "./team-member-action-buttons"

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  property_manager: "Property Manager",
  accountant: "Accountant",
  support_staff: "Support Staff",
}

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-100 text-red-800",
  property_manager: "bg-blue-100 text-blue-800",
  accountant: "bg-green-100 text-green-800",
  support_staff: "bg-yellow-100 text-yellow-800",
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  inactive: "bg-gray-100 text-gray-800",
}

export default async function TeamPage() {
  const teamMembers = await getTeamMembers()

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Team</h1>
          <p className="text-muted-foreground">Manage your team members and their roles</p>
        </div>
        <Button asChild>
          <Link href="/team/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Team Member
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>View and manage your property management team</CardDescription>
        </CardHeader>
        <CardContent>
          {teamMembers.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-center">
              <div className="space-y-3">
                <p className="text-muted-foreground">No team members yet</p>
                <Button asChild>
                  <Link href="/team/new">Add your first team member</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Name</th>
                    <th className="text-left py-3 px-4 font-semibold">Email</th>
                    <th className="text-left py-3 px-4 font-semibold">Role</th>
                    <th className="text-left py-3 px-4 font-semibold">Status</th>
                    <th className="text-left py-3 px-4 font-semibold">Joined</th>
                    <th className="text-left py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teamMembers.map((member: any) => (
                    <tr key={member.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        {member.first_name} {member.last_name}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{member.email}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            ROLE_COLORS[member.role] || "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {ROLE_LABELS[member.role] || member.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            STATUS_COLORS[member.status] || "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {member.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {new Date(member.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <TeamMemberActionButtons memberId={member.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
