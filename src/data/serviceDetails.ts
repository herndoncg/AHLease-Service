// Extra depth for each service page: how a job goes, what moves the price, and more questions.
// Added Nov 17, 2026 so each page answers more of what an operator searches for.
// Same rule as services.ts: standard trade wording, and no claims about licenses, insurance,
// certifications, past clients or prices that Colton has not confirmed.

export interface ServiceDetail {
  steps: { h: string; p: string }[];
  price: string[];
  faqs: { q: string; a: string }[];
}

export const details: Record<string, ServiceDetail> = {
  'lease-road-construction': {
    steps: [
      { h: 'Walk the route', p: 'We look at the route from the county road to the location: soil, low spots, crossings, and where water wants to go.' },
      { h: 'Clear and cut the subgrade', p: 'Timber and brush come off the right-of-way, soft spots are cut out, and the subgrade is shaped and compacted.' },
      { h: 'Rock and shape', p: 'Road rock is hauled in, spread and compacted, then the road is crowned and ditched so it sheds water.' },
      { h: 'Crossings and finish', p: 'Culverts, low-water crossings and cattle guard approaches go in, and the road is dressed for traffic.' },
    ],
    price: ['Length, width and rock depth', 'How far rock has to be hauled', 'Clearing: open pasture or timber', 'Soft or wet ground that needs undercut or fabric', 'Number of culverts and crossings'],
    faqs: [
      { q: 'How much does a lease road cost?', a: 'It depends mostly on length, width, rock depth and how far the rock is hauled. Our lease road estimator gives a planning range from the size you enter, and a firm bid comes after we walk the route.' },
      { q: 'What rock is used on lease roads?', a: 'It depends on what is available near the location and what the road has to carry. Crushed stone, iron ore gravel and other local road materials are all used in East Texas. We price the material that makes sense for the haul and the traffic.' },
      { q: 'When is the best time to build a lease road?', a: 'When the ground is dry. A road built on dry, compacted subgrade holds up far longer than one pushed in during a wet stretch.' },
    ],
  },
  'pad-construction': {
    steps: [
      { h: 'Walk the staked location', p: 'We check the footprint, the slope, drainage around the site and the route for trucks hauling rock.' },
      { h: 'Strip and stockpile topsoil', p: 'Topsoil comes off and is stockpiled so it can go back when the location is reduced or restored.' },
      { h: 'Cut, fill and compact', p: 'The pad is brought to grade and compacted in lifts so it stays level under a rig.' },
      { h: 'Rock, berms and drainage', p: 'The location is capped with rock, and berms and ditches are built so water moves around it, not across it.' },
    ],
    price: ['Pad size and rock depth', 'How much cut and fill the slope needs', 'Clearing timber', 'Haul distance for rock', 'Extras: pits, cellars, tank battery pads, berms'],
    faqs: [
      { q: 'How big is a typical well pad?', a: 'It varies with the rig and the number of wells. Single-well locations are much smaller than multi-well pads. We build to the footprint the operator stakes.' },
      { q: 'How deep should pad rock be?', a: 'Six inches of compacted rock is common for a drilling location, more on soft ground. The pad estimator lets you try different depths.' },
      { q: 'Can you reduce a pad after drilling?', a: 'Yes. Pulling rock back to the production footprint, respreading topsoil and regrading is part of what we do.' },
    ],
  },
  'general-dirt-work': {
    steps: [
      { h: 'Tell us the job', p: 'Send the location and what needs to happen. A photo helps.' },
      { h: 'Look and price', p: 'Small jobs can often be priced over the phone. Bigger ones get a site visit.' },
      { h: 'Dig, haul, grade', p: 'We do the excavation, haul material in or out, and grade it back.' },
      { h: 'Leave it clean', p: 'Spoil is hauled or spread where it belongs, and the area is dressed.' },
    ],
    price: ['Hours of machine time the job takes', 'Material hauled in or out, and how far', 'Access to the work area', 'Whether a line or utility is nearby'],
    faqs: [
      { q: 'Do you do small dirt jobs?', a: 'Yes. Grouping a few small items on the same lease into one trip keeps the cost down.' },
      { q: 'Do you work near buried lines?', a: 'Yes, carefully. Lines are located and called in before digging, and we daylight them by hand or with water before a machine works close.' },
    ],
  },
  'fencing-and-gates': {
    steps: [
      { h: 'Lay out the line', p: 'We mark corners, gates and where the fence ties into existing fence.' },
      { h: 'Set corners and braces', p: 'H-braces and corners go in first, because they hold the fence tight.' },
      { h: 'Posts and wire', p: 'Line posts are set and wire, panel or pipe is hung and stretched.' },
      { h: 'Gates and cattle guards', p: 'Gates are hung level and cattle guards are set on footings with wings tied in.' },
    ],
    price: ['Length of fence and type: barbed wire, net wire, panel or pipe', 'Number of gates and cattle guards', 'Ground conditions for setting posts', 'Clearing along the fence line'],
    faqs: [
      { q: 'What kind of fence goes around a wellhead or tank battery?', a: 'It depends on the operator and the livestock on the place. Pipe and cable, panel and barbed wire are all common. We build what the operator specifies.' },
      { q: 'Do you fix landowner fence cut for a road?', a: 'Yes. We tie the new gate or cattle guard into the existing fence and match the wire and post spacing.' },
    ],
  },
  'row-mowing': {
    steps: [
      { h: 'Get the route', p: 'Send the right-of-way: maps, mileage, width and any trouble spots.' },
      { h: 'Set the schedule', p: 'One-time cleanup, or a set number of cuts through the growing season.' },
      { h: 'Mow and trim', p: 'The right-of-way is mowed, and risers, markers, valves and fence lines are trimmed by hand.' },
      { h: 'Report back', p: 'You hear what was cut and anything we saw along the line worth a look, like washouts or missing markers.' },
    ],
    price: ['Acres: length times width', 'How long since the last cut, and any brush in it', 'Terrain, creek crossings and access points', 'One cut or a season schedule'],
    faqs: [
      { q: 'How much does right-of-way mowing cost per acre?', a: 'It depends on growth, terrain and access. The mowing estimator gives a planning range from the miles and width or the acres.' },
      { q: 'Do you report problems you see on the line?', a: 'Yes. A mowing crew is often the first to see a washout, an exposed line or a missing marker, and we tell you.' },
    ],
  },
  'weed-spraying': {
    steps: [
      { h: 'Look at what is growing', p: 'The product depends on the weeds and what is next to the area, such as pasture, water or crops.' },
      { h: 'Plan the program', p: 'Bare ground for pads and batteries, selective spraying for rights-of-way, or both.' },
      { h: 'Apply', p: 'Applications stay inside the treated area, around risers, firewalls and fence lines.' },
      { h: 'Follow up', p: 'A later visit catches anything that came back, so the area stays clean for the season.' },
    ],
    price: ['Acres treated', 'Bare-ground or selective program', 'Number of applications in the season', 'Access and how spread out the locations are'],
    faqs: [
      { q: 'What is bare-ground spraying?', a: 'A treatment that keeps all vegetation off an area, such as a pad, inside a firewall or around a wellhead, for most of a season.' },
      { q: 'How much does weed spraying cost per acre?', a: 'It depends on the program and the number of applications. The spraying estimator gives a planning range from the acres.' },
    ],
  },
  'location-signs': {
    steps: [
      { h: 'Send the list', p: 'Lease names, well numbers and the wording each sign needs.' },
      { h: 'Make the signs', p: 'Signs are made to that wording, sized to be read from the entrance or the road.' },
      { h: 'Install', p: 'Signs go up on posts or mounts at each location.' },
      { h: 'Record', p: 'You get a list of what was installed where.' },
    ],
    price: ['Number of signs', 'Sign size and material', 'Posts and mounting', 'How spread out the locations are'],
    faqs: [
      { q: 'Who decides the wording on a well sign?', a: 'The operator, following the state regulator’s rules. We make the sign to the wording you send.' },
      { q: 'Can you replace shot-up or faded signs?', a: 'Yes. Send the list and we replace them in one pass.' },
    ],
  },
  'pipeline-markers': {
    steps: [
      { h: 'Get the plan', p: 'Alignment sheets or a marker plan from the operator.' },
      { h: 'Walk the line', p: 'We check what is there, what is missing and what is damaged.' },
      { h: 'Set markers', p: 'Markers go in at crossings and along the right-of-way to the plan.' },
      { h: 'Report', p: 'You get a record of what was set and where.' },
    ],
    price: ['Number of markers', 'Who supplies the markers', 'Miles of line and access', 'Whether it is paired with mowing'],
    faqs: [
      { q: 'Where do pipeline markers go?', a: 'At road, rail and water crossings and along the right-of-way so the line can be followed, set to the operator’s plan.' },
      { q: 'Can markers be done with mowing?', a: 'Yes, and it is the efficient way: the crew is already on the right-of-way.' },
    ],
  },
  'pressure-washing-daylighting': {
    steps: [
      { h: 'Say what needs cleaning or exposing', p: 'Equipment, a battery, a whole location, or a line that needs to be daylighted.' },
      { h: 'Set up containment', p: 'Runoff is kept on location and inside containment.' },
      { h: 'Wash or daylight', p: 'Equipment is washed down, or soil is carefully removed from around a buried line.' },
      { h: 'Clean up', p: 'The area is left clean, and daylighted lines are left ready for the next crew.' },
    ],
    price: ['Size and number of things to clean', 'How heavy the buildup is', 'Depth and length of line to daylight', 'Water source on location'],
    faqs: [
      { q: 'Why wash equipment on a lease?', a: 'Clean equipment shows a leak the day it starts, is easier to inspect and work on, and looks right for a sale or an audit.' },
      { q: 'Is daylighting the same as hydro-excavation?', a: 'Hydro-excavation is one way to daylight a line. The goal is the same: see the line before anyone digs near it.' },
    ],
  },
  'jobsite-cleanup': {
    steps: [
      { h: 'Walk the location', p: 'We see what was left: trash, junk iron, material, ruts.' },
      { h: 'Haul off', p: 'Trash, scrap and unused material are loaded and hauled away.' },
      { h: 'Dress the site', p: 'The pad and road are bladed and ruts filled.' },
      { h: 'Restore if needed', p: 'For a reduced or abandoned location: pull rock, spread topsoil, grade and reseed.' },
    ],
    price: ['How much there is to haul', 'Scrap and junk iron', 'Grading and rut repair', 'Reseeding and restoration'],
    faqs: [
      { q: 'Do you restore locations for the landowner?', a: 'Yes. Pulling rock, respreading topsoil, grading to drain and reseeding to what the agreement calls for.' },
      { q: 'How soon after a rig leaves can you clean up?', a: 'Call ahead with the rig-down date and we schedule the cleanup for when the last truck leaves.' },
    ],
  },
  'spill-cleanup': {
    steps: [
      { h: 'Call', p: 'Call 903-424-1607 with the county, the lease and what released. Emergencies are answered 24/7.' },
      { h: 'Contain', p: 'Berms, dikes or trenches stop the spread first.' },
      { h: 'Recover and remove', p: 'Free liquid is recovered and affected soil is excavated and loaded.' },
      { h: 'Backfill and restore', p: 'Clean fill goes back and the site is regraded when the cleanup is released.' },
    ],
    price: ['Size of the release and how far it spread', 'Volume of soil to remove', 'Where recovered material has to go', 'Time of day and how fast we must respond'],
    faqs: [
      { q: 'What should I do first when I find a spill?', a: 'Make it safe, stop the source if it can be done safely, and call. Containing the spread early keeps the cleanup smaller.' },
      { q: 'Do you handle the regulator reporting?', a: 'No. Reporting stays with the operator. We do the field work and give you the counts you need for your records.' },
    ],
  },
  'location-security': {
    steps: [
      { h: 'Say what needs watching', p: 'The location, the equipment on it, and how long.' },
      { h: 'Agree the call list', p: 'Who gets called, and when law enforcement is called.' },
      { h: 'Coverage starts', p: 'Monitoring runs around the clock for as long as it is needed.' },
      { h: 'Reports', p: 'Activity on location is reported to your contact.' },
    ],
    price: ['How long coverage runs', 'How many locations', 'Remoteness and access'],
    faqs: [
      { q: 'When is a location most at risk of theft?', a: 'In the gaps: between crews, during rig moves and shut-ins, when equipment and material sit with nobody on site.' },
      { q: 'Can coverage be short-term?', a: 'Yes, from a single rig move to as long as equipment is on location.' },
    ],
  },
};
