import "server-only";
import { Types } from "mongoose";
import type { SessionUser } from "./auth";
import { Category, Course, Location, Trainer } from "./models";
import { locationScope } from "./permissions";

/** Options for certificate forms, restricted to what the actor may use. */
export async function certificateFormOptions(u: SessionUser, include: { course?: string; location?: string; trainer?: string; approver?: string } = {}) {
  const scope = locationScope(u);
  const scopeIds = scope?.map((x) => new Types.ObjectId(x));
  const [cats, courses, locs, people] = await Promise.all([
    Category.find().sort({ sortOrder: 1 }).lean(),
    Course.find({ $or: [{ isActive: true }, ...(include.course ? [{ _id: include.course }] : [])] }).sort({ sortOrder: 1, name: 1 }).lean(),
    Location.find({ $and: [scopeIds ? { _id: { $in: scopeIds } } : {}, { $or: [{ isActive: true }, ...(include.location ? [{ _id: include.location }] : [])] }] }).sort({ sortOrder: 1 }).lean(),
    Trainer.find({
      $and: [
        scopeIds ? { $or: [{ location: { $in: scopeIds } }, { location: null }] } : {},
        { $or: [{ isActive: true }, ...[include.trainer, include.approver].filter(Boolean).map((id) => ({ _id: id }))] },
      ],
    }).sort({ name: 1 }).lean(),
  ]);
  const code = (id: unknown) => cats.find((c) => String(c._id) === String(id))?.code || "";
  return {
    courses: courses.map((c) => ({ value: String(c._id), label: `${code(c.category)} · ${c.name}`, name: c.name, validity: c.defaultValidityMonths })),
    locations: locs.map((l) => ({ value: String(l._id), label: `${l.name}${l.isActive ? "" : " (inactive)"}` })),
    trainers: people.filter((p) => p.type === "TRAINER").map((p) => ({ value: String(p._id), label: p.name })),
    approvers: people.filter((p) => p.type === "APPROVER").map((p) => ({ value: String(p._id), label: p.name })),
  };
}
