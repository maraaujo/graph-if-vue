<template>
  <VCol cols="12">
    <VCard title="Gerar grafo através de uma matriz">
      <VCardText>
        <div :style="gridStyle">
          
          <div v-for="(row, rowIndex) in matrix" :key="rowIndex">
            {{ rowIndex }}    
            <div v-for="(cell, colIndex) in row" :key="`${rowIndex}-${colIndex}`" @click="editCell(rowIndex, colIndex)"
              class="matrix-cell">
              {{ cell }}
            </div>
          </div>

        </div>
      </VCardText>
    </VCard>
  </VCol>
  <div class="d-flex flex-wrap gap-4 justify-sm-space-between justify-center">
    <VBtn @click="addVertex" color="primary" class="mb-4">Adicionar vértice</VBtn>
    <VBtn @click="generateGraphFromMatrix" color="success" class="mb-4 ml-2">
      Gerar Grafo
    </VBtn>
  </div>
<VCard>
  <VCol cols="12" md="6">
      <VTextField v-model="graphData.nodeLabel" label="Label do novo nó" />
  </VCol>
</VCard>
  <VCard title="Buscar rota">

    <VRow>
        <VCol cols="12" md="6">
              <VTextField v-model="rotaInicio" label="Nó inicial" />
            </VCol>
            <VCol cols="12" md="6">
              <VTextField v-model="rotaDestino" label="Nó destino" />
            </VCol>
       <VCol cols="12">
    <div class="d-flex flex-wrap gap-4 justify-sm-space-between justify-center">
      <VBtn color="success" @click="encontrarMelhorRota(rotaInicio, rotaDestino)">
        Melhor Rota
      </VBtn>
      <VBtn color="success" @click="encontrarMaiorRota(rotaInicio, rotaDestino)">
        Maior Rota
      </VBtn>
    </div>
  </VCol>
    </VRow>
  </VCard>


  <VCol>
    <div ref="container" style="height: 400px; border: 1px solid #ccc; margin-top: 20px;"></div>

  </VCol>
</template>
<script setup>
import cytoscape from "cytoscape";
import { onMounted, reactive, ref } from "vue";
import { toast } from "vue3-toastify";
const cy = ref(null);
let count = 0;
const container = ref(null);
const selectedNodes = ref([]);
const graphData = reactive({
  listAdjacecia: [],
  nodeId: "",
  nodeLabel: "",
  sourceId: "",
  targetId: "",
  edgeWeight: 0,
});
const matrix = ref([
  [0, 0],
  [0, 0]
]);
onMounted(() => {
  cy.value = cytoscape({
    container: container.value,
    elements: [],
    style: [
      {
        selector: "node",
        style: {
          label: "data(label)",
          "background-color": "#7B61FF",
          color: "#fff",
          "text-valign": "center",
          "text-halign": "center",
          width: 50,
          height: 50,
        }
      },
      {
        selector: "edge",
        style: {
          label: "data(weight)",
          width: 3,
          'label': 'data(weight)',
          "line-color": "#888",
          "target-arrow-color": "#888",
          "target-arrow-shape": "triangle",
          "curve-style": "bezier",
        }
      },
      {
        selector: ".highlight",
        style: {
          "background-color": "#00e676",
          "line-color": "#00e676",
          "target-arrow-color": "#00e676",
          "transition-property": "background-color, line-color, target-arrow-color",
          "transition-duration": "0.5s",
        },
      },
      {

        selector: ".selected",
        style: {
          "border-width": 3,
          "border-color": "#FFD700",
          "border-style": "solid",
        },
      }
    ],
    layout: {
      name: "cose",
      animate: true,
    }
  });
  cy.value.on("tap", (event) => {
    const target = event.target;

    if (
      target !== cy.value &&
      typeof target.isNode === "function" &&
      target.isNode()
    ) {
      //recebe o id
      const nodeId = target.id();

      if (!selectedNodes.value.includes(nodeId)) {
        target.addClass("selected");
        selectedNodes.value.push(nodeId);
      }

      if (selectedNodes.value.length === 2) {
        const [source, targetId,] = selectedNodes.value;
        console.log("dois nós selecionados", [source, targetId]);
        const edgeId = [source, targetId].join("-");

        if (!cy.value.getElementById(edgeId).length) {
          cy.value.add({
            group: "edges",
            data: { id: edgeId, source: source, target: targetId, weight: 1 },
          });
        }

        selectedNodes.value.forEach((id) => {
          cy.value.getElementById(id).removeClass("selected");
        });

        selectedNodes.value = [];

      }
    } else {
      const pos = event.position || event.renderedPosition;
      console.log("posição", pos);
      // Define um novo id incremental para o nó
      const newNodeId = "n" + (count++);

      cy.value.add({
        group: "nodes",
        data: {
          id: newNodeId,
          label: graphData.nodeLabel|| newNodeId,
          color: "#7B61FF",
        },
        position: { x: pos.x, y: pos.y },
      });


    }

  });
});
function generateGraphFromMatrix() {
  if (!cy.value) return;
  cy.value.elements().remove(); // limpa grafo anterior

  const size = matrix.value.length;

  // Adiciona nós
  const nodes = Array.from({ length: size }, (_, i) => ({
    data: { id: `${i}` }
  }));

  // Adiciona arestas com base na matriz
  const edges = [];
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const weight = matrix.value[i][j];
      if (weight !== 0) {
        edges.push({
          data: {
            id: `${i}-${j}`,
            source: `${i}`,
            target: `${j}`,
            weight
          }
        });
      }
    }
  }

  cy.value.add([...nodes, ...edges]);

  // Layout automático
  cy.value.layout({ name: "circle" }).run();
}

function editCell(row, col) {
  const newValue = parseInt(prompt(`Novo valor para [${row}][${col}]`, matrix.value[row][col]));
  if (!isNaN(newValue)) {
    matrix.value[row][col] = newValue;
  }
}

function addVertex() {
  const newSize = matrix.value.length + 1;
  matrix.value.forEach(row => row.push(0));
  matrix.value.push(Array(newSize).fill(0));

}



function encontrarMelhorRota(inicio, destino) {
  if (!cy.value.getElementById(inicio).length || !cy.value.getElementById(destino).length) {
    toast.error("Nó inicial ou final não existe.");
    return;
  }

  // Remove destaque anterior
  cy.value.edges().removeClass("highlight");
  cy.value.nodes().removeClass("highlight");

  const dijkstra = cy.value.elements().dijkstra(`#${inicio}`, (edge) => edge.data("weight"));

  const path = dijkstra.pathTo(cy.value.getElementById(destino));

  if (!path || path.length === 0) {
    toast.warning("Rota não encontrada.");
    return;
  }

  path.forEach((el) => {
    el.addClass("highlight");
  });

  const pathStr = path
    .filter((el) => el.isNode?.())
    .map((n) => n.id())
    .join(" ➝ ");

  toast.success(`Melhor rota: ${pathStr}`);
}
function encontrarMaiorRota(inicio, destino) {
  console.log("chamou");

  const visitados = new Set();         // Armazena os nós visitados
  let maiorCaminho = [];               // Armazena o maior caminho
  let maiorPeso = 0;                   // Armazena o peso do maior caminho

  const startNode = cy.value.getElementById(inicio);
  const endNode = cy.value.getElementById(destino);

  if (!startNode.length || !endNode.length) {
    toast.error("Nó inicial ou final não existe.");
    return;
  }

  function dfs(atual, caminho, pesoTotal) {
    if (atual === destino) {
      if (pesoTotal > maiorPeso) {
        maiorPeso = pesoTotal;
        maiorCaminho = [...caminho]; // Salva o caminho atual
      }
      return;
    }

    visitados.add(atual); // Marca o nó atual como visitado

    const vizinhos = cy.value.getElementById(atual).connectedEdges().filter(edge => {
      return edge.source().id() === atual && !visitados.has(edge.target().id());
    });

    vizinhos.forEach(edge => {
      const prox = edge.target().id();
      const peso = edge.data("weight"); // CORRETO
      dfs(prox, [...caminho, edge, edge.target()], pesoTotal + peso);
    });

    visitados.delete(atual); // Remove da lista de visitados ao retornar
  }

  // INÍCIO DA EXECUÇÃO DA BUSCA
  dfs(inicio, [startNode], 0);

  if (maiorCaminho.length === 0) {
    toast.warning("Rota não encontrada.");
    return;
  }

  // Limpa estilos anteriores
  cy.value.edges().removeClass("highlight");
  cy.value.nodes().removeClass("highlight");

  // Destaca o caminho mais longo encontrado
  maiorCaminho.forEach((el) => {
    el.addClass("highlight");
  });

}


</script>
<style>
.matrix-cell {
  display: inline-block;
  width: 30px;
  height: 30px;
  line-height: 30px;
  border: 1px solid #ccc;
  text-align: center;
  cursor: pointer;
  margin: 2px;
  background-color: #f9f9f9;
}

.matrix-cell:hover {
  background-color: #e0e0e0;
}
</style>
