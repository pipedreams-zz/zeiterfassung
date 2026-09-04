import type { Metadata } from "next";

import { PageHead } from "@/components/app-shell";
import { Panel, PanelHead, PanelSection } from "@/components/chrome";
import { requireOwner } from "@/lib/actor";
import { listMembers, listUserOrganizations } from "@/lib/data/members";

import { MemberRow } from "./member-row";
import { NewMemberForm } from "./new-member-form";
import { OrganizationForm } from "./organization-form";
import { OrganizationsPanel } from "./organizations-panel";

export const metadata: Metadata = { title: "Verwaltung" };

export default async function AdminPage() {
  const actor = await requireOwner();
  const members = listMembers(actor.organizationId);
  const organizations = listUserOrganizations(actor.userId);

  return (
    <>
      <PageHead title="Verwaltung" />
      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-[1fr_380px] lg:items-start">
        <Panel>
          <PanelHead
            title={`${actor.organizationName} · ${members.length} ${members.length === 1 ? "Mitglied" : "Mitglieder"}`}
          />
          <ul className="flex flex-col gap-px bg-line-soft">
            {members.map((m) => (
              <MemberRow key={m.userId} member={m} self={m.userId === actor.userId} />
            ))}
          </ul>
        </Panel>

        <div className="flex flex-col gap-[18px]">
          <Panel>
            <PanelHead title="Neues Mitglied" />
            <div className="p-4">
              <NewMemberForm />
            </div>
          </Panel>
          <Panel>
            <PanelHead title="Organisation" />
            <PanelSection label="Name der aktiven Organisation">
              <OrganizationForm name={actor.organizationName} />
            </PanelSection>
            <OrganizationsPanel organizations={organizations} activeId={actor.organizationId} />
          </Panel>
        </div>
      </div>
    </>
  );
}
