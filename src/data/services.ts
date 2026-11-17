// Every service A&H offers. Each one gets its own page at /services/<slug>, made automatically.
// To drop a service, delete its block. To add one, copy a block and change the words.
//
// The 12 services are the ones listed on the old one-page site. The wording is standard for the
// trade (Colton asked for industry-standard wording on Nov 14, 2026). Nothing here claims a license,
// certification, insurance or a past client. Add those only once Colton confirms them.

export type Group = 'build' | 'maintain' | 'respond';

export interface Service {
  slug: string;
  name: string;
  /** Short name for menus and lists. */
  nav: string;
  group: Group;
  /** One line under the name in lists. */
  short: string;
  /** Page title for Google, under 60 characters with " | A&H Lease Services" NOT added. */
  title: string;
  description: string;
  intro: string;
  scope: string[];
  when: string;
  faqs: { q: string; a: string }[];
  /** Which estimator tab prices this service, if any. */
  estimator?: 'road' | 'pad' | 'mowing' | 'spraying';
}

export const groups: { key: Group; name: string; line: string }[] = [
  { key: 'build', name: 'Build', line: 'Access and locations, from bare ground to ready for the rig.' },
  { key: 'maintain', name: 'Maintain', line: 'The standing work that keeps a lease passable, clean and marked.' },
  { key: 'respond', name: 'Respond', line: 'When something goes wrong on location, day or night.' },
];

export const services: Service[] = [
  {
    slug: 'lease-road-construction', name: 'Lease Road Construction & Maintenance', nav: 'Lease roads', group: 'build', estimator: 'road',
    short: 'New access roads built, and washed-out roads put back in shape.',
    title: 'Lease Road Construction in East Texas',
    description: 'Lease road construction and maintenance from Longview, TX: clearing, subgrade, rock, crowning, ditching and culverts across Texas, Louisiana, Arkansas and Oklahoma.',
    intro: 'A lease road has to carry rig moves, frac traffic and the pumper’s truck in every kind of weather. We build new access from the county road to the location and we rework roads that have rutted, washed or pumped. The road is shaped to shed water first, because water is what takes a lease road out.',
    scope: ['Clearing and grubbing the right-of-way', 'Cutting and compacting the subgrade', 'Hauling, spreading and compacting road rock', 'Crowning, ditching and turnouts so water leaves the road', 'Culverts, low-water crossings and cattle guard approaches', 'Blading and re-rocking existing roads'],
    when: 'Call before the rig schedule is set. A road built on dry subgrade lasts far longer than one pushed in during a wet week.',
    faqs: [
      { q: 'How wide and how thick should a lease road be?', a: 'Most lease roads run 14 to 20 feet wide with 4 to 8 inches of compacted rock. Heavy rig and frac traffic, soft ground and steep grades all push that up. We size it to the traffic the operator expects.' },
      { q: 'Can you fix a road without rebuilding it?', a: 'Often, yes. If the base is sound, blading the road back to a crown, reopening the ditches and adding rock where it has thinned is enough. If the subgrade is pumping mud through the rock, that section needs to be cut out and rebuilt.' },
    ],
  },
  {
    slug: 'pad-construction', name: 'Pad Construction & Maintenance', nav: 'Pads', group: 'build', estimator: 'pad',
    short: 'Drilling and production pads cut, leveled, compacted and rocked.',
    title: 'Oilfield Pad Construction, Longview TX',
    description: 'Well pad construction and maintenance from Longview, TX: stripping topsoil, cut and fill, compaction, rock, berms and drainage for drilling and production locations.',
    intro: 'A pad is only as good as what is under the rock. We strip and stockpile topsoil, balance the cut and fill, compact in lifts and cap the location with rock so it holds a rig and stays level through production. When a location needs to be reworked, expanded or reduced after drilling, we handle that too.',
    scope: ['Clearing, stripping and stockpiling topsoil', 'Cut and fill to grade, compacted in lifts', 'Pad rock hauled, spread and compacted', 'Berms, ditches and drainage around the location', 'Pits, cellars and tank battery pads', 'Regrading and re-rocking existing locations'],
    when: 'Bring us in once the location is staked. We walk it with you, look at the drainage and the haul route for rock, and price it from what is actually there.',
    faqs: [
      { q: 'How long does a pad take to build?', a: 'It depends on size, how much dirt has to move and the weather. A straightforward location on fairly level ground is usually a matter of days, not weeks. Heavy cut and fill, timber and wet ground add time.' },
      { q: 'Do you build the road and the pad together?', a: 'Yes. Doing both with one crew and one mobilization is the usual way and it saves money over splitting the work.' },
    ],
  },
  {
    slug: 'general-dirt-work', name: 'General Dirt Work', nav: 'Dirt work', group: 'build',
    short: 'Excavation, grading, backfill and haul-off with our own equipment.',
    title: 'Oilfield Dirt Work & Excavation, East Texas',
    description: 'Oilfield dirt work from Longview, TX: excavation, grading, backfill, pit work, berms, drainage and material hauling.',
    intro: 'Plenty of work on a lease does not fit a neat category. A line needs to be dug up and backfilled, a berm has to go around a battery, a pit needs closing, a washout needs filling. We run our own equipment, so one call covers the digging, the hauling and the finish grade.',
    scope: ['Excavation and trenching', 'Finish grading and drainage work', 'Containment berms and firewalls', 'Pit digging, closing and backfill', 'Hauling rock, dirt and fill', 'Erosion repair and washouts'],
    when: 'If it involves moving dirt on or around a location, call. Small jobs are welcome.',
    faqs: [
      { q: 'Is there a minimum job size?', a: 'No job is too small to call about. Short jobs carry the cost of moving equipment, so it often pays to group a few items on the same lease into one trip.' },
      { q: 'Can you haul material in and out?', a: 'Yes. We haul rock, select fill and spoil ourselves.' },
    ],
  },
  {
    slug: 'fencing-and-gates', name: 'Fencing & Gate Installation', nav: 'Fencing & gates', group: 'build',
    short: 'Location fence, cattle panels, gates and cattle guards.',
    title: 'Oilfield Fencing & Gate Installation',
    description: 'Oilfield fencing and gate installation from Longview, TX: location and tank battery fence, pipe and cable, barbed wire, cattle panels, gates and cattle guards.',
    intro: 'Fence on a lease does two jobs. It keeps livestock and the public away from equipment, and it keeps the landowner’s fences working where a road crosses them. We put up location fence, gates and cattle guards that hold up to stock and truck traffic.',
    scope: ['Wellhead, pumping unit and tank battery fence', 'Barbed wire, net wire and cattle panel fence', 'Pipe gates and lease-road entrance gates', 'Cattle guards set on proper footings', 'H-braces and corners built to stay tight', 'Repairs to landowner fence cut for access'],
    when: 'Fence and gates go in best right after the road and pad are finished, while equipment is still on location.',
    faqs: [
      { q: 'Can you match the landowner’s existing fence?', a: 'Yes. Where a lease road goes through a pasture fence, we tie the new gate or cattle guard into the fence that is there and match the wire and post spacing.' },
      { q: 'Do you install cattle guards?', a: 'Yes. We set the guard on footings, build the wings and tie the fence into it so stock cannot walk around.' },
    ],
  },
  {
    slug: 'row-mowing', name: 'Pipeline, Pad & Powerline Mowing', nav: 'ROW mowing', group: 'maintain', estimator: 'mowing',
    short: 'Rights-of-way, locations and lease roads kept cut on a schedule.',
    title: 'Pipeline Right-of-Way Mowing, East Texas',
    description: 'Pipeline right-of-way, pad and powerline mowing from Longview, TX. Scheduled or one-time cuts that keep lines visible for patrol and locations clear of fire fuel.',
    intro: 'A right-of-way that has grown up cannot be patrolled, flown or walked, and tall grass around a location is fire fuel. We mow pipeline and powerline rights-of-way, pads and lease-road shoulders, and trim by hand around risers, markers, meter runs and fence the mower cannot reach.',
    scope: ['Pipeline and powerline right-of-way mowing', 'Pad, tank battery and facility mowing', 'Lease-road shoulders and ditches', 'Hand trimming around risers, markers and valves', 'One-time cleanup cuts on overgrown ground', 'Set schedules through the growing season'],
    when: 'In East Texas the growing season runs roughly March through October. Most rights-of-way hold with two to four cuts a year.',
    faqs: [
      { q: 'How is right-of-way mowing priced?', a: 'By the acre, which comes from the length and the width of the right-of-way. Ground that has gone more than a season uncut, or has brush in it, costs more the first time. A set schedule lowers the price per cut.' },
      { q: 'Can you work around above-ground equipment?', a: 'Yes. The crew keeps mowers back from risers, valves and meter runs and trims those areas by hand.' },
    ],
  },
  {
    slug: 'weed-spraying', name: 'Weed Spraying & Vegetation Management', nav: 'Weed spraying', group: 'maintain', estimator: 'spraying',
    short: 'Bare-ground and selective spraying for pads, batteries and rights-of-way.',
    title: 'Oilfield Weed Spraying & Vegetation Control',
    description: 'Oilfield weed spraying and vegetation management from Longview, TX: bare-ground treatment for pads and tank batteries, and selective spraying on rights-of-way.',
    intro: 'Vegetation inside a firewall or around a wellhead is a fire and inspection problem. Bare-ground spraying keeps pads, batteries and facility yards clean for the season. On rights-of-way, selective spraying knocks back brush and broadleaf weeds and leaves the grass that holds the soil.',
    scope: ['Bare-ground treatment for pads and tank batteries', 'Fence lines, firewalls and facility yards', 'Selective brush and broadleaf control on rights-of-way', 'Spot treatment around risers and markers', 'Spring and follow-up applications', 'Paired with mowing where both are needed'],
    when: 'Bare-ground work does best with an application in early spring before weeds are up, and a follow-up later in the season.',
    faqs: [
      { q: 'How long does a bare-ground treatment last?', a: 'A good application typically holds for most of a growing season. Heavy rain, soil type and the weeds involved all affect it, which is why a follow-up visit is usually part of the program.' },
      { q: 'Will spraying harm the pasture next to the location?', a: 'The product and method are chosen for what is growing and what is next to it, and applications are kept inside the area being treated. We go over that with you before any work starts.' },
    ],
  },
  {
    slug: 'location-signs', name: 'Location Sign Manufacturing', nav: 'Location signs', group: 'maintain',
    short: 'Lease, well and tank battery signs made and installed.',
    title: 'Oilfield Lease & Well Location Signs',
    description: 'Oilfield location signs made and installed from Longview, TX: lease and well identification signs, tank battery signs, entrance signs and warning signs.',
    intro: 'Every lease, well and tank battery needs a legible sign carrying the identification the regulator calls for, and they fade, get shot and get knocked down. We make and install location signs to the wording you supply, and replace missing or unreadable ones across a field in one pass.',
    scope: ['Lease and well identification signs', 'Tank battery and facility signs', 'Lease-road entrance and directional signs', 'Warning and safety signs', 'Posts, mounting and installation', 'Field-wide replacement of faded or missing signs'],
    when: 'Signs are easiest to handle as a batch. Send a list of leases and wells and we make and install the set.',
    faqs: [
      { q: 'What information goes on a location sign?', a: 'The operator supplies the wording, since identification rules are set by the state regulator, such as the Railroad Commission of Texas. We make the sign to that wording and install it where it can be read from the road or the entrance.' },
      { q: 'Can you replace signs across a whole field?', a: 'Yes. We work from your well list, replace what is missing or unreadable and note what was done at each location.' },
    ],
  },
  {
    slug: 'pipeline-markers', name: 'Pipeline Marker Installation', nav: 'Pipeline markers', group: 'maintain',
    short: 'Line markers set and replaced at crossings and along the right-of-way.',
    title: 'Pipeline Marker Installation & Replacement',
    description: 'Pipeline marker installation and replacement from Longview, TX: line markers at road, rail and water crossings and along the right-of-way, set to the operator’s plan.',
    intro: 'Line markers are what stand between a buried pipeline and somebody’s excavator. They belong at road, rail and water crossings and along the right-of-way so the line can be followed, and they go missing constantly. We set new markers and replace damaged ones to the operator’s plan.',
    scope: ['New markers at road, rail and water crossings', 'Line-of-sight markers along the right-of-way', 'Replacing damaged, faded and missing markers', 'Marker posts supplied by the operator or by us', 'Often paired with right-of-way mowing', 'A record of what was set and where'],
    when: 'Marker work pairs well with mowing. The crew is already on the right-of-way and can see what is missing.',
    faqs: [
      { q: 'Do you supply the markers?', a: 'Either way. Many operators supply posts with their own name and emergency number on them. If you want us to source them, we can.' },
      { q: 'How do you know where markers go?', a: 'From the operator’s alignment sheets or marker plan. We set markers to that plan and report what was installed.' },
    ],
  },
  {
    slug: 'pressure-washing-daylighting', name: 'Pressure Washing & Daylighting', nav: 'Washing & daylighting', group: 'maintain',
    short: 'Equipment and locations washed down, and buried lines exposed safely.',
    title: 'Oilfield Pressure Washing & Daylighting',
    description: 'Oilfield pressure washing and daylighting from Longview, TX: wellheads, pumping units, tank batteries and equipment cleaned, and buried lines exposed without damage.',
    intro: 'Clean equipment is easier to inspect, easier to work on and shows a leak the day it starts. We wash wellheads, pumping units, tank batteries and equipment. Daylighting is the other half of this service: exposing a buried line carefully so it can be seen and worked on without a bucket ever touching it.',
    scope: ['Wellheads, pumping units and tank batteries', 'Equipment and location wash-downs', 'Cleaning before painting, inspection or sale', 'Daylighting buried lines and utilities', 'Potholing to confirm line location and depth', 'Cleanup after a workover'],
    when: 'Wash before an inspection, a sale or a paint job. Daylight before any digging near a line whose depth is not certain.',
    faqs: [
      { q: 'What is daylighting?', a: 'Daylighting, also called potholing, is uncovering a buried line so you can see exactly where it is and how deep. It is done carefully, without digging on the line with a machine, before excavation work nearby.' },
      { q: 'Where does the wash water go?', a: 'Wash-downs are planned so runoff stays on location and inside containment. How it is handled from there follows the operator’s own procedure.' },
    ],
  },
  {
    slug: 'jobsite-cleanup', name: 'Jobsite Cleanup', nav: 'Jobsite cleanup', group: 'maintain',
    short: 'Locations picked up, hauled off and left in order after the work is done.',
    title: 'Oilfield Jobsite & Location Cleanup',
    description: 'Oilfield jobsite cleanup from Longview, TX: trash, junk iron and debris hauled off, locations dressed after drilling, completions and workovers, and sites restored.',
    intro: 'After a rig, a frac crew or a workover leaves, a location is rarely left the way the operator or the landowner wants it. We pick it up, haul off the trash and junk, dress the pad and the road and leave the site in order.',
    scope: ['Trash, debris and junk iron hauled off', 'Cleanup after drilling, completion and workover', 'Dressing the pad and road when the trucks are gone', 'Removing old fence, liners and unused material', 'Pit closure and location reduction', 'Reseeding and final site restoration'],
    when: 'Schedule cleanup for the day the last crew leaves. Landowner complaints are far cheaper to prevent than to settle.',
    faqs: [
      { q: 'Can you restore a location that is being reduced or abandoned?', a: 'Yes. That is dirt work and cleanup together: pulling rock, respreading topsoil, grading to drain and reseeding to what the lease or the landowner agreement calls for.' },
      { q: 'Do you haul off scrap and junk iron?', a: 'Yes. Tell us what is there and we bring the right truck.' },
    ],
  },
  {
    slug: 'spill-cleanup', name: 'Hazardous Liquid Spill Cleanup', nav: 'Spill cleanup', group: 'respond',
    short: 'Containment, recovery and cleanup when a line, tank or truck lets go.',
    title: 'Oilfield Spill Cleanup & Response, East Texas',
    description: 'Oilfield spill cleanup from Longview, TX, with 24/7 call-out: containment, recovery, removal of affected soil, backfill and site restoration under the operator’s direction.',
    intro: 'When a flowline, a tank or a truck lets go, the first hours decide how big the cleanup gets. We answer the call day or night, bring equipment and hands to contain and recover the release, remove affected soil, and put the location back. The work is done under the operator’s direction, and reporting to the regulator stays with the operator.',
    scope: ['24/7 call-out', 'Berms, dikes and trenching to stop the spread', 'Recovering free liquid and placing absorbent', 'Excavating and loading affected soil', 'Clean backfill and regrading', 'Site restoration when the cleanup is released'],
    when: 'Call 903-424-1607 the moment a release is found. Stopping the spread comes first.',
    faqs: [
      { q: 'How fast can a crew get to a spill?', a: 'We take spill calls 24 hours a day and roll from Longview. Time on the road depends on where the location is. Tell us the county and the nearest road when you call and we will give you a straight answer.' },
      { q: 'Who handles reporting and disposal paperwork?', a: 'The operator holds the reporting duty to the regulator and decides where recovered material goes. We do the field work to that direction and give you the load and yardage counts you need for your records.' },
    ],
  },
  {
    slug: 'location-security', name: '24/7 Monitored Location Security', nav: 'Location security', group: 'respond',
    short: 'Around-the-clock monitoring for locations, equipment and material.',
    title: '24/7 Oilfield Location Security Monitoring',
    description: '24/7 monitored location security from Longview, TX: around-the-clock monitoring for drilling, completion and production locations, equipment yards and stored material.',
    intro: 'Copper, batteries, fuel, tools and tubulars walk off unattended locations. Monitored security puts eyes on a location around the clock, during a rig move, a completion, a shut-in or any stretch when valuable equipment is sitting. We set the coverage to the site and the length of the job.',
    scope: ['Around-the-clock monitoring', 'Drilling, completion and production locations', 'Equipment yards and stored material', 'Gate and access monitoring', 'Short-term coverage during rig moves and shut-ins', 'Activity reported to the operator'],
    when: 'Set coverage up before equipment arrives. A location is most exposed in the gap between crews.',
    faqs: [
      { q: 'Is coverage available for short jobs?', a: 'Yes. Coverage can run for a single rig move or completion, or stay in place for as long as equipment is on location.' },
      { q: 'What happens when something is seen on location?', a: 'The operator’s contact is notified right away, and local law enforcement is called when the situation calls for it. The call list is agreed before coverage starts.' },
    ],
  },
];

export const byGroup = (g: Group) => services.filter((s) => s.group === g);
