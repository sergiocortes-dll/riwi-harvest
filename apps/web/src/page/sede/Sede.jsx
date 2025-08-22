import TreeView from "@/components/ui/tree-view";
import { Link, useParams } from "@harvest/router";

/**
 * @typedef {Object} TreeNote
 * @property {string} label - Texto que se muestra en el nodo del árbol.
 * @property {TreeNote[]} [children] - Array de nodos hijos (subnodos)
 * @property {React.ComponentType<any> [component]} - Componente personalizado para renderizar el label.
 * @property {Object} [componentProps] - Props adicionales para el componente personalizado.
 */

/**
 * Datos jerárquicos para el TreeView.
 *
 * @type {TreeNote[]}
 */
const data = [
  {
    label: "Cohorte 4",
    children: [
      {
        label: "Jornada AM",
        children: [
          {
            label: "Desarrollo",
            children: [
              {
                label: "Hopper",
                component: Link,
                componentProps: { to: "/sede/med/cohorte-4/hopper" },
              },
              {
                label: "Goslin",
                component: Link,
                componentProps: { to: "/sede/med/cohorte-4/goslin" },
              },
            ],
          },
        ],
      },
      {
        label: "Jornada PM",
        children: [
          {
            label: "Desarrollo",
            children: [
              {
                label: "Tesla",
                component: Link,
                componentProps: { to: "/sede/med/cohorte-4/hopper" },
              },
            ],
          },
        ],
      },
    ],
  },
  {
    label: "Cohorte 3",
    children: [
      {
        label: "Ruta básica",
      },
    ],
  },
];

export default function Sede() {
  const params = useParams();
  return (
    <div>
      <TreeView data={data} />
    </div>
  );
}
