// Address-specific public property records, checked 2026-11-25 and 2026-11-26.
// Brick construction is documented; exposed finish, color and bond are not photo-certified.
export const PARK_BRICK_ADDRESSES=Object.freeze(['2228 N PARK AVE','2230 N PARK AVE','2232 N PARK AVE','2234 N PARK AVE','2240 N PARK AVE','2242 N PARK AVE','2244 N PARK AVE','2246 N PARK AVE','2236 N PARK AVE','2238 N PARK AVE','2248 N PARK AVE','2252 N PARK AVE','2254 N PARK AVE','2256 N PARK AVE','2258 N PARK AVE','2264 N PARK AVE','2306 N PARK AVE','2308 N PARK AVE','2312 N PARK AVE','2328 N PARK AVE']);
const documented=new Set(PARK_BRICK_ADDRESSES);
export const hasParkBrick=(name,height)=>documented.has(name)&&height>=4.5;
