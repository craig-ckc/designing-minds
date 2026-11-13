/**
 * "CAPS" with its expansion in the `title` (WCAG 3.1.4, technique H28) for copy that no longer
 * spells the acronym out in visible text (the Figma About and Grades leads). No dotted underline:
 * the copy reads as plain text, as drawn. The Home hero still defines CAPS in readable text.
 */
export function CapsAbbr() {
  return (
    <abbr title="Curriculum and Assessment Policy Statement, South Africa’s national curriculum" className="no-underline">
      CAPS
    </abbr>
  )
}
