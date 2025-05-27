<template>
  <VRow>
    <VCol cols="12">
      <VCard title="Grafo com Rota e Peso">
        <VCardText>
          <VForm @submit.prevent="submit">
            <VRow>
              <VCol cols="12" md="4">
                <VTextField v-model="graphData.nodeId" label="ID do nó" />
              </VCol>

              <VCol cols="12" md="4">
                <VTextField v-model="graphData.nodeLabel" label="Rótulo do nó" />
              </VCol>

              <VCol cols="12" md="4">
                <VTextField
                  v-model.number="graphData.edgeWeight"
                  label="Peso da aresta"
                  type="number"
                />
              </VCol>

              <VCol cols="12" md="6">
                <VTextField v-model="graphData.sourceId" label="Nó de origem" />
              </VCol>

              <VCol cols="12" md="6">
                <VTextField v-model="graphData.alvoId" label="Nó de destino" />
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </VCol>

    <VCol cols="12" class="d-flex justify-end">
      <VBtn color="primary" @click="submit">Criar</VBtn>
    </VCol>

    <VCol cols="12">
      <VCard title="Buscar melhor rota">
        <VCardText>
          <VRow>
            <VCol cols="12" md="6">
              <VTextField v-model="rotaInicio" label="Nó inicial" />
            </VCol>
            <VCol cols="12" md="6">
              <VTextField v-model="rotaDestino" label="Nó destino" />
            </VCol>
            <VCol cols="12" class="d-flex justify-end">
              <VBtn color="success" @click="encontrarMelhorRota(rotaInicio, rotaDestino)">
                Encontrar Melhor Rota
              </VBtn>
            </VCol>
          </VRow>
        </VCardText>
      </VCard>
    </VCol>

    <VDataTable
      :items="listGraph"
      :headers="headers"
      hide-default-footer
      class="text-no-wrap rounded-t-0"
    >
      <template #item.nodeId="{ item }">
        <span class="text-primary font-weight-semibold">#{{ item.nodeId }}</span>
      </template>

      <template #item.nodeLabel="{ item }">
        <VTextField
          v-model="item.nodeLabel"
          hide-details
          dense
          solo
          @change="updateNodeLabel(item.nodeId, item.nodeLabel)"
        />
      </template>

      <template #item.edgeWeight="{ item }">
        <VTextField
          v-model.number="item.edgeWeight"
          hide-details
          dense
          solo
          @change="updateEdgeWeight(item.nodeId, item.edgeWeight)"
        />
      </template>
    </VDataTable>

    <VCol cols="12">
      <div id="cyt" style="height: 500px; border: 1px solid #ccc"></div>
    </VCol>

    <VCol cols="12">
      <div class="flex flex-col gap-4 p-4">
        <div ref="container" class="h-[400px] border rounded"></div>

        <h2 class="text-xl font-bold mt-4">Matriz de Adjacência</h2>

        <table border="1" class="border-collapse w-fit">
          <thead>
            <tr>
              <th></th>
              <th v-for="node in nodes" :key="node">{{ node }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in adjacencyMatrix" :key="i">
              <th>{{ nodes[i] }}</th>
              <td v-for="(value, j) in row" :key="j">{{ value }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </VCol>
  </VRow>
</template>

<script setup>
import cytoscape from "cytoscape";
import { onMounted, reactive, ref } from "vue";
import { toast } from "vue3-toastify";

let count = 0;
const cy = ref(null);
const rotaInicio = ref("");
const rotaDestino = ref("");
const selectedNodes = ref([]);
const listGraph = ref([]);
const nodes = ref([]);
const adjacencyMatrix = ref([]);

const headers = [
  { title: "Id", key: "nodeId" },
  { title: "Nome do nó", key: "nodeLabel" },
  { title: "Peso", key: "edgeWeight" },
];

const graphData = reactive({
  nodeId: "",
  nodeLabel: "",
  sourceId: "",
  alvoId: "",
  edgeWeight: 1,
});

const updateNodeLabel = (id, newLabel) => {
  const node = cy.value.getElementById(id);
  if (node && node.length > 0) {
    node.data("label", newLabel);
  }
};

const updateEdgeWeight = (nodeId, newWeight) => {
  // Como peso pertence à aresta (edge), precisamos identificar a aresta conectada ao nó e atualizar
  // Se seu grafo é orientado, pode ajustar aqui conforme necessário.
  // Aqui, só atualizarei todas as arestas conectadas ao nó com o novo peso para exemplo.

  const edges = cy.value.edges().filter((edge) =>
    edge.source().id() === nodeId || edge.target().id() === nodeId
  );

  edges.forEach((edge) => {
    edge.data("weight", Number(newWeight));
  });

  // Atualiza também o listGraph para refletir a mudança, caso armazene peso na lista
  const item = listGraph.value.find((item) => item.nodeId === nodeId);
  if (item) {
    item.edgeWeight = Number(newWeight);
  }

  cy.value.layout({ name: "cose", animate: true }).run();
  updateAdjacencyMatrix();
};

onMounted(() => {
  cy.value = cytoscape({
    container: document.getElementById("cyt"),
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
      },
    ],
    layout: {
      name: "cose",
      animate: true,
    },
  });

  cy.value.on("tap", (event) => {
    const alvo = event.alvo;

    if (
      alvo !== cy.value &&
      typeof alvo.isNode === "function" &&
      alvo.isNode()
    ) {
      //recebe o id
      const nodeId = alvo.id();

      if (!selectedNodes.value.includes(nodeId)) {
        alvo.addClass("selected");
        selectedNodes.value.push(nodeId);
      }

      if (selectedNodes.value.length === 2) {
        const [fonte, alvoId] = selectedNodes.value;
        const edgeId = [fonte, alvoId].sort().join("-");

        if (!cy.value.getElementById(edgeId).length) {
          cy.value.add({
            group: "edges",
            data: { id: edgeId, fonte, alvo: alvoId, weight: 1 },
          });
        }

        selectedNodes.value.forEach((id) => {
          cy.value.getElementById(id).removeClass("selected");
        });

        selectedNodes.value = [];
        updateAdjacencyMatrix();
      }
    } else if (
      alvo === cy.value ||
      alvo === cy.value.container() ||
      alvo.group === undefined
    ) {
      const pos = event.position || event.renderedPosition;

      // Define um novo id incremental para o nó
      const newNodeId = `n${count++}`;

      cy.value.add({
        group: "nodes",
        data: {
          id: newNodeId,
          label: `Nó ${newNodeId}`,
          color: "#7B61FF",
        },
        position: { x: pos.x, y: pos.y },
      });

      listGraph.value.push({
        nodeId: newNodeId,
        nodeLabel: `Nó ${newNodeId}`,
        edgeWeight: 1,
      });

      updateAdjacencyMatrix();
    }
  });
});

function submit() {
  // Validação para evitar duplicatas e campos vazios
  if (graphData.nodeId && graphData.nodeLabel) {
    if (cy.value.getElementById(graphData.nodeId).length === 0) {
      cy.value.add({
        group: "nodes",
        data: {
          id: graphData.nodeId,
          label: graphData.nodeLabel,
          color: "#7B61FF",
        },
      });

      listGraph.value.push({
        nodeId: graphData.nodeId,
        nodeLabel: graphData.nodeLabel,
        edgeWeight: graphData.edgeWeight || 1,
      });
    } else {
      toast.warning("Nó com este ID já existe.");
    }
  }

  if (graphData.sourceId && graphData.alvoId) {
    const edgeId = [graphData.sourceId, graphData.alvoId].sort().join("-");
    if (cy.value.getElementById(edgeId).length === 0) {
      cy.value.add({
        group: "edges",
        data: {
          id: edgeId,
          source: graphData.sourceId,
          alvo: graphData.alvoId,
          weight: graphData.edgeWeight || 1,
        },
      });
    } else {
      toast.warning("Aresta já existe.");
    }
  }

  cy.value.layout({ name: "cose", animate: true }).run();

  updateAdjacencyMatrix();

  // Limpa campos
  graphData.nodeId = "";
  graphData.nodeLabel = "";
  graphData.sourceId = "";
  graphData.alvoId = "";
  graphData.edgeWeight = 1;
}

function updateAdjacencyMatrix() {
  nodes.value = cy.value.nodes().map((node) => node.id());
  const size = nodes.value.length;
  const matrix = Array(size)
    .fill(0)
    .map(() => Array(size).fill(0));

  // Preencher a matriz com pesos
  cy.value.edges().forEach((edge) => {
    const sourceIndex = nodes.value.indexOf(edge.data("source"));
    const alvoIndex = nodes.value.indexOf(edge.data("alvo"));
    matrix[sourceIndex][alvoIndex] = edge.data("weight") || 1;
    // Se grafo não direcionado, também preencher o inverso
    matrix[alvoIndex][sourceIndex] = edge.data("weight") || 1;
  });

  adjacencyMatrix.value = matrix;
}

function encontrarMelhorRota(startId, endId) {
  if (!cy.value.getElementById(startId).length || !cy.value.getElementById(endId).length) {
    toast.error("Nó inicial ou final inválido.");
    return;
  }

  // Algoritmo simples de Dijkstra para encontrar menor caminho
  const distances = {};
  const previous = {};
  const nodesToVisit = new Set(nodes.value);

  nodes.value.forEach((nodeId) => {
    distances[nodeId] = Infinity;
    previous[nodeId] = null;
  });

  distances[startId] = 0;

  while (nodesToVisit.size > 0) {
    const currentNode = [...nodesToVisit].reduce((minNode, nodeId) => {
      return distances[nodeId] < distances[minNode] ? nodeId : minNode;
    });

    if (distances[currentNode] === Infinity) break;
    if (currentNode === endId) break;

    nodesToVisit.delete(currentNode);

    const neighbors = cy.value
      .edges()
      .filter((edge) => edge.source().id() === currentNode)
      .map((edge) => ({
        id: edge.alvo().id(),
        weight: edge.data("weight"),
      }));

    neighbors.forEach(({ id: neighbor, weight }) => {
      if (nodesToVisit.has(neighbor)) {
        const alt = distances[currentNode] + (weight || 1);
        if (alt < distances[neighbor]) {
          distances[neighbor] = alt;
          previous[neighbor] = currentNode;
        }
      }
    });
  }

  // Reconstruir caminho
  let path = [];
  let u = endId;
  while (u) {
    path.unshift(u);
    u = previous[u];
  }

  if (path[0] !== startId) {
    toast.info("Não existe caminho entre os nós selecionados.");
    return;
  }

  // Limpar highlight anterior
  cy.value.elements().removeClass("highlight");

  // Destacar caminho
  for (let i = 0; i < path.length - 1; i++) {
    const edgeId = [path[i], path[i + 1]].sort().join("-");
    const edge = cy.value.getElementById(edgeId);
    if (edge.length) {
      edge.addClass("highlight");
    }
    cy.value.getElementById(path[i]).addClass("highlight");
  }
  cy.value.getElementById(path[path.length - 1]).addClass("highlight");

  toast.success(`Melhor rota encontrada: ${path.join(" -> ")}`);
}
</script>
