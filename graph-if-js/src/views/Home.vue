<template>
  <VRow>
    <!-- Matriz de Adjacência -->
    <VCol cols="12">
      <VCard title="Gerar grafo através de uma matriz">
        <VCardText>
          <div class="matrix-grid">
            <div
              v-for="(row, rowIndex) in matrix"
              :key="rowIndex"
              class="matrix-row"
              :style="rowGridStyle"
            >
              <div
                v-for="(cell, colIndex) in row"
                :key="`${rowIndex}-${colIndex}`"
                class="matrix-cell"
                @click="editCell(rowIndex, colIndex)"
              >
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

    <!-- Diálogo para editar label -->
    <VDialog v-model="dialogeditarLabelNo" max-width="400">
      <VCard>
        <VCardTitle class="text-h6">Editar Label</VCardTitle>
        <VCardText>
          <VTextField v-model="noSelecionadoParaLabelLabel" label="Novo nome do nó" />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn text @click="dialogeditarLabelNo = false">Cancelar</VBtn>
          <VBtn color="primary" @click="confirmarEdicaoLabel">Salvar</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Diálogo para excluir nó -->
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

    <!-- Seção de Rotas -->
    <VCol cols="12">
      <VCard title="Buscar rota">
        <VCardText>
          <VRow>
            <VCol cols="12" md="6">
              <VTextField v-model="rotaInicio" label="Nó inicial" />
            </VCol>
            <VCol cols="12" md="6">
              <VTextField v-model="rotaDestino" label="Nó destino" />
            </VCol>
            <VCol cols="12">
              <div class="d-flex flex-wrap gap-4 justify-sm-space-between justify-center">
                <VBtn color="success" @click="encontrarMelhorRota(rotaInicio, rotaDestino)">Melhor Rota</VBtn>
                <VBtn color="success" @click="encontrarTodasRotas(rotaInicio, rotaDestino)">Todas as rotas</VBtn>
                <VBtn color="success" @click="encontrarMaiorRota(rotaInicio, rotaDestino)">Maior Rota</VBtn>
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
import { ref, reactive, computed, onMounted } from "vue";
import { toast } from "vue3-toastify";

const cy = ref(null);
const container = ref(null);
const count = ref(0);
const selectedNodes = ref([]);
const rotaInicio = ref("");
const rotaDestino = ref("");
const matrix = ref([
  [0, 0],
  [0, 0],
]);

const dialogExcluirNo = ref(false);
const dialogeditarLabelNo = ref(false);
const noSelecionado = ref(null);
const noSelecionadoParaLabel = ref(null);
const noSelecionadoParaLabelLabel = ref("");

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
    toast.warning("Laços não são permitidos.");
    return;
  }

  const current = matrix.value[i][j];
  const newValue = prompt(`Peso da aresta de ${i} para ${j}:`, current);
  if (newValue !== null && !isNaN(newValue)) {
    matrix.value[i][j] = parseInt(newValue);
    updateEdgeInGraph(i, j, parseInt(newValue));
  }
}

function updateEdgeInGraph(i, j, weight) {
  const edgeId = `${i}-${j}`;
  const edge = cy.value.getElementById(edgeId);
  if (edge.length) {
    edge.data("weight", weight);
  }
}

function excluirNo() {
  const id = parseInt(noSelecionado.value.id().replace(/\D/g, ""));
  if (!isNaN(id)) {
    matrix.value.splice(id, 1);
    matrix.value.forEach((row) => row.splice(id, 1));
    cy.value.getElementById(noSelecionado.value.id()).remove();
  }
  noSelecionado.value = null;
  dialogExcluirNo.value = false;
}

function confirmarEdicaoLabel() {
  if (noSelecionadoParaLabel.value) {
    noSelecionadoParaLabel.value.data("label", noSelecionadoParaLabelLabel.value);
    toast.success("Label atualizado.");
  }
  dialogeditarLabelNo.value = false;
  noSelecionadoParaLabel.value = null;
}

function generateGraphFromMatrix() {
  cy.value.elements().remove();
  const size = matrix.value.length;

  const nodes = Array.from({ length: size }, (_, i) => ({
    data: { id: `${i}`, label: `n${i}` },
  }));

  const edges = [];
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const weight = matrix.value[i][j];
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
    }
  }

  cy.value.add([...nodes, ...edges]);
  cy.value.layout({ name: "cose", animate: true }).run();
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

// As funções de encontrarMelhorRota, encontrarTodasRotas, encontrarMaiorRota
// são as mesmas que você já tem — me avise se quiser que eu cole todas aqui também

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
        selector: ".selected",
        style: {
          "border-color": "#FFD700",
          "border-width": 4,
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
    ],
    layout: {
      name: "cose",
      animate: true,
    },
  });

  cy.value.on("tap", (event) => {
    const clicked = event.target;

    if (clicked === cy.value) {
      // Clique em espaço vazio: cria novo nó
      const pos = event.position;
      const id = `${count.value}`;
      count.value++;

      cy.value.add({
        group: "nodes",
        data: { id, label: `n${id}` },
        position: pos,
      });

      // Atualiza matriz
      matrix.value.forEach((row) => row.push(0));
      matrix.value.push(new Array(matrix.value.length + 1).fill(0));

    } else if (clicked.isNode && clicked.isNode()) {
      const nodeId = clicked.id();

      // Adiciona nó à seleção para criar aresta
      if (!selectedNodes.value.includes(nodeId)) {
        clicked.addClass("selected");
        selectedNodes.value.push(nodeId);
      }

      if (selectedNodes.value.length === 2) {
        const [a, b] = selectedNodes.value;
        const edgeId = `${a}-${b}`;

        if (!cy.value.getElementById(edgeId).length) {
          cy.value.add({
            group: "edges",
            data: { id: edgeId, source: a, target: b, weight: 1 },
          });

          matrix.value[parseInt(a)][parseInt(b)] = 1;
        }

        selectedNodes.value.forEach((id) =>
          cy.value.getElementById(id).removeClass("selected")
        );
        selectedNodes.value = [];
      }

      // Abre diálogo para editar label
      noSelecionadoParaLabel.value = clicked;
      noSelecionadoParaLabelLabel.value = clicked.data("label");
      dialogeditarLabelNo.value = true;
    }
  });

  cy.value.on("cxttap", "node", (event) => {
    // Clique com botão direito em nó: abre diálogo para excluir
    noSelecionado.value = event.target;
    dialogExcluirNo.value = true;
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
