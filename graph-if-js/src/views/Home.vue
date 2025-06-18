<template>
  <VRow>
    <!-- Matriz de Adjacência -->
    <VCol cols="12">
      <VCard title="Gerar grafo através de uma matriz">
        <VCardText>
          <div class="matrix-grid">
            <div v-for="(row, rowIndex) in matrix" :key="rowIndex" class="matrix-row" :style="rowGridStyle">
              <div v-for="(cell, colIndex) in row" :key="`${rowIndex}-${colIndex}`" class="matrix-cell"
                @click="editCell(rowIndex, colIndex)">
                {{ cell }}
              </div>
            </div>
          </div>
        </VCardText>
      </VCard>
    </VCol>

    <VCol cols="12" class="d-flex flex-wrap gap-4 justify-sm-space-between justify-center">
      <VBtn @click="addVertex" color="primary">Adicionar vértice</VBtn>
      <VBtn @click="generateGraphFromMatrix" color="success">Gerar Grafo</VBtn>
    </VCol>
<VDataTable :items="listGraph" :headers="headers" hide-default-footer class="text-no-wrap rounded-t-0">
      <template #item.nodeId="{ item }">
        <span class="text-primary font-weight-semibold">#{{ item.nodeId }}</span>
      </template>
</VDataTable>
   
    <VCol cols="12">
      <VCard title="Buscar rota">
        <VCardText>
      <VDialog v-model="dialogeditarLabelNo" max-width="400">
  <VCard>
    <VCardTitle class="text-h6">Editar Label</VCardTitle>
    <VCardText>
      <VTextField
        v-model="noSelecionadoParaLabelLabel"
        label="Novo nome do nó"
      />
    </VCardText>
    <VCardActions>
      <VSpacer />
      <VBtn text @click="dialogeditarLabelNo = false">Cancelar</VBtn>
      <VBtn color="primary" @click="confirmarEdicaoLabel">Salvar</VBtn>
    </VCardActions>
  </VCard>
</VDialog>
<VDialog v-model="dialogExcluirNo" max-width="400">
  <VCard>
    <VCardTitle class="text-h6">Excluir Nó</VCardTitle>
    <VCardText>
      Tem certeza que deseja excluir o nó
      <strong>{{ noSelecionado?.id() }}</strong> e todas as conexões?
    </VCardText>
    <VCardActions>
      <VSpacer />
      <VBtn text @click="dialogExcluirNo = false">Cancelar</VBtn>
      <VBtn color="error" @click="excluirNo">Excluir</VBtn>
    </VCardActions>
  </VCard>
</VDialog>

  
 <!-- Seção de Busca de Rotas -->
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
                <VBtn color="success" @click="encontrarTodasRotas(rotaInicio, rotaDestino)">
                  Todas as rotas
                </VBtn>
                <VBtn color="success" @click="encontrarMaiorRota(rotaInicio, rotaDestino)">
                  Maior Rota
                </VBtn>
                <VBtn color="info" @click="exportarGrafoJson">Exportar JSON</VBtn>

              </div>
            </VCol>
          </VRow>
        </VCardText>
      </VCard>
    </VCol>

    <!-- Container do grafo -->
    <VCol cols="12">
      <div ref="container" style="height: 500px; border: 1px solid #ccc"></div>
    </VCol>
  </VRow>
</template>

<script setup>
import cytoscape from "cytoscape";
import { onMounted, reactive, ref, computed } from "vue";
import { toast } from "vue3-toastify";

const cy = ref(null);
const container = ref(null);
const rotaInicio = ref("");
const dialogExcluirNo = ref(false);
const dialogeditarLabelNo = ref(false);
const noSelecionadoParaLabel = ref(false);
const noSelecionado = ref(null);
const rotaDestino = ref("");
const selectedNodes = ref([]);
const listGraph = ref([]);
let count = 0;
const noSelecionadoParaLabelLabel = ref("");
const headers = [
  { title: "Id", key: "nodeId" },
  { title: "Nome do nó", key: "nodeLabel" },
  { title: "Peso", key: "edgeWeight" },
];
function confirmarEdicaoLabel() {
  if (noSelecionadoParaLabel.value) {
    const node = noSelecionadoParaLabel.value;
    node.data("label", noSelecionadoParaLabelLabel.value);
    toast.success(`Label do nó ${node.id()} atualizado.`);
  }
  dialogeditarLabelNo.value = false;
  noSelecionadoParaLabel.value = null;
}
const graphData = reactive({
  nodeLabel: "",
  nodeId: "",
  sourceId: "",
  targetId: "",
  edgeWeight: 0,
});

const matrix = ref([
  [0, 0],
  [0, 0],
]);

const rowGridStyle = computed(() => ({
  display: "grid",
  gridTemplateColumns: `repeat(${matrix.value.length}, 40px)`,
  gap: "5px",
}));

function addVertex() {
  matrix.value.forEach((row) => row.push(0));
  matrix.value.push(new Array(matrix.value.length + 1).fill(0));
}

function editCell(i, j) {
  if (i === j) {
    toast.warning("Laços não são permitidos (arestas de um nó para ele mesmo).");
    return;
  }

  const current = matrix.value[i][j];
  const newValue = prompt(`Peso da aresta de ${i} para ${j}:`, current);
  if (!isNaN(newValue) && newValue !== null) {
    const novoPeso = parseInt(newValue);
    matrix.value[i][j] = novoPeso;

    // Atualiza diretamente no grafo, se a aresta existir
    const edgeId = `${i}-${j}`;
    const edge = cy.value.getElementById(edgeId);
    if (edge.length > 0) {
      edge.data("weight", novoPeso);
    }
  }
}


function generateGraphFromMatrix() {
  cy.value.elements().remove();
  const size = matrix.value.length;

  const nodes = Array.from({ length: size }, (_, i) => ({
    data: { id: `${i}`, label: graphData.nodeLabel || `n${i}` },
  }));

  const edges = [];
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const weight = matrix.value[i][j];
      console.log("aqui maria", weight)
      if (weight !== 0 && i !== j) {
        edges.push({
          data: {
            id: `${i}-${j}`,
            source: `${i}`,
            target: `${j}`,
            weight,
          },
        });
      }
    edgeWeight.value = weight.value;
    }
  }

  cy.value.add([...nodes, ...edges]);
  cy.value.layout({ name: "cose", animate: true }).run();
}
function encontrarTodasRotas(inicio, destino) {
  const todasRotas = [];
  const visitados = new Set();

  const startNode = cy.value.getElementById(inicio);
  console.log("no de  inicio")
  const endNode = cy.value.getElementById(destino);

  if (!startNode.length || !endNode.length) {
    toast.error("Nó inicial ou final não existe.");
    return;
  }

  function dfs(atual, caminho, pesoTotal) {
    if (atual === destino) {
      todasRotas.push({ caminho: [...caminho], peso: pesoTotal });
      return;
    }

    visitados.add(atual);

    const vizinhos = cy.value.getElementById(atual).connectedEdges().filter((edge) => {
      return edge.source().id() === atual && !visitados.has(edge.target().id());
    });

    vizinhos.forEach((edge) => {
      const prox = edge.target().id();
      const peso = edge.data("weight");
      dfs(prox, [...caminho, edge, edge.target()], pesoTotal + peso);
    });

    visitados.delete(atual);
  }

  dfs(inicio, [startNode], 0);

  if (todasRotas.length === 0) {
    toast.warning("Nenhuma rota encontrada.");
    return;
  }

  // Exibe no console todas as rotas encontradas
  console.log("Rotas possíveis:");
  todasRotas.forEach((rota, i) => {
    const rotaStr = rota.caminho.filter((el) => el.isNode?.()).map((n) => n.id()).join(" ➔ ");
    console.log(`Rota ${i + 1}: ${rotaStr} (Peso: ${rota.peso})`);
  });

  // Destaca a primeira rota no grafo
  cy.value.edges().removeClass("highlight");
  cy.value.nodes().removeClass("highlight");
  todasRotas[0].caminho.forEach((el) => el.addClass("highlight"));

  toast.success(`Encontradas ${todasRotas.length} rotas. Veja o console para detalhes.`);
}
function encontrarMelhorRota(inicio, destino) {
  if (!cy.value.getElementById(inicio).length || !cy.value.getElementById(destino).length) {
    toast.error("Nó inicial ou final não existe.");
    return;
  }
  cy.value.edges().removeClass("highlight");
  cy.value.nodes().removeClass("highlight");

  const dijkstra = cy.value.elements().dijkstra(`#${inicio}`, (edge) => edge.data("weight"));
  const path = dijkstra.pathTo(cy.value.getElementById(destino));

  if (!path || path.length === 0) {
    toast.warning("Rota não encontrada.");
    return;
  }

  path.forEach((el) => el.addClass("highlight"));

  const pathStr = path.filter((el) => el.isNode?.()).map((n) => n.id()).join(" ➔ ");
  toast.success(`Melhor rota: ${pathStr}`);
}

function encontrarMaiorRota(inicio, destino) {
  const visitados = new Set();
  let maiorCaminho = [];
  let maiorPeso = 0;
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
        maiorCaminho = [...caminho];
      }
      return;
    }

    visitados.add(atual);

    const vizinhos = cy.value.getElementById(atual).connectedEdges().filter((edge) => {
      return edge.source().id() === atual && !visitados.has(edge.target().id());
    });

    vizinhos.forEach((edge) => {
      const prox = edge.target().id();
      const peso = edge.data("weight");
      dfs(prox, [...caminho, edge, edge.target()], pesoTotal + peso);
    });

    visitados.delete(atual);
  }

  dfs(inicio, [startNode], 0);

  if (maiorCaminho.length === 0) {
    toast.warning("Rota não encontrada.");
    return;
  }

  cy.value.edges().removeClass("highlight");
  cy.value.nodes().removeClass("highlight");
  maiorCaminho.forEach((el) => el.addClass("highlight"));
}
function exportarGrafoJson() {
  const json = cy.value.json();
  const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "grafo.json";
  a.click();
  URL.revokeObjectURL(url);
}

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
        },
      },
      {
        selector: "edge",
        style: {
          label: "data(weight)",
          width: 3,
          "line-color": "#888",
          "target-arrow-color": "#888",
          "target-arrow-shape": "triangle",
          "curve-style": "bezier",
        },
      },
      {
        selector: ".highlight",
        style: {
          "background-color": "#00e676",
          "line-color": "#00e676",
          "target-arrow-color": "#00e676",
        },
      },
       {
        selector: ".selected",
        style: {
          "border-width": 3,
          "border-color": "#5500ff",
          "border-style": "solid",
        },
      },
    ],
    layout: {
      name: "cose",
      animate: true,
    },
  });
  cy.value.on("tap", (event) => {
    const clickedElement = event.target;
   
    if (
      clickedElement !== cy.value &&
      typeof clickedElement.isNode === "function" &&
      clickedElement.isNode()
    ) {
      const nodeId = clickedElement.id();

      if (!selectedNodes.value.includes(nodeId)) {
        clickedElement.addClass("selected");
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
          const i = parseInt(source.replace(/\D/g, ""));
const j = parseInt(targetId.replace(/\D/g, ""));
if (!isNaN(i) && !isNaN(j)) {
  if (matrix.value[i] && matrix.value[i][j] !== undefined) {
    matrix.value[i][j] = 1;
  }
}
        }

        selectedNodes.value.forEach((id) => {
          cy.value.getElementById(id).removeClass("selected");
        });

        selectedNodes.value = [];
    
      }
    } else {
      const pos = event.position || event.renderedPosition;
      const newNodeId = "n" + count++;

      const label = graphData.nodeLabel || newNodeId;

      cy.value.add({
        group: "nodes",
        data: {
          id: newNodeId,
          label,
          color: "#7B61FF",
        },
        position: { x: pos.x, y: pos.y },
      });

      listGraph.value.push({
        nodeId: newNodeId,
        nodeLabel: label,
        edgeWeight: 1,
      });
      matrix.value.forEach(row => row.push(0));
matrix.value.push(new Array(matrix.value.length + 1).fill(0));
    }
  });
  //excluir no 
  cy.value.on("cxttap", "node", (event) => {
    const node = event.target; // nó clicado 
    noSelecionado.value = node; //armazena o nó selecionado 
    console.log("no para excluir", node.id(), node.data())

    dialogExcluirNo.value = true;
  });

   cy.value.on("tap", "node", (event) => {
    const node = event.target;
    noSelecionadoParaLabel.value = node;
    dialogeditarLabelNo.value = true;
  });
  cy.value.on("tap", "node", (event) => {
  const node = event.target; //nó clicado
  noSelecionadoParaLabel.value = node; 
  noSelecionadoParaLabelLabel.value = node.data("label"); // preencher o input
  dialogeditarLabelNo.value = true;
});
});
</script>

<style scoped>
.matrix-grid {
  display: flex;
  flex-direction: column;
  gap: 5px;
  overflow-x: auto;
  padding: 10px 0;
}

::v-deep(.cytoscape-container) {
  cursor: pointer;
}

.matrix-row {
  width: fit-content;
}

.matrix-cell {
  width: 40px;
  height: 40px;
  border: 1px solid #ccc;
  text-align: center;
  line-height: 40px;
  cursor: pointer;
  user-select: none;
}
</style>
