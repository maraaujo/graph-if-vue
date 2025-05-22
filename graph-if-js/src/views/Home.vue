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
                <VTextField v-model="graphData.edgeWeight" label="Peso da aresta" type="number" />
              </VCol>

              <VCol cols="12" md="6">
                <VTextField v-model="graphData.sourceId" label="Nó de origem" />
              </VCol>

              <VCol cols="12" md="6">
                <VTextField v-model="graphData.targetId" label="Nó de destino" />
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
      title="Histórico de nós"
      :items="listGraph"
      :headers="headers"
      hide-default-footer
      class="text-no-wrap rounded-t-0"
    >
      <template #item.nodeId="{ item }">
        <span class="text-primary font-weight-semibold">
          #{{ item.nodeId }}
        </span>
      </template>
    </VDataTable>

    <VCol cols="12">
      <div id="cyt" style="height: 500px; border: 1px solid #ccc;"></div>
    </VCol>
  </VRow>
</template>

<script setup>
import cytoscape from 'cytoscape'
import { onMounted, reactive, ref } from 'vue'
import { toast } from 'vue3-toastify'

const cy = ref(null)
const rotaInicio = ref('')
const rotaDestino = ref('')
const selectedNodes = ref([])
const listGraph = ref([])

const headers = [
  { title: "Id", key: "nodeId", sortable: true },
  { title: "Nome do nó", key: "nodeLabel", sortable: true },
]

const graphData = reactive({
  nodeId: '',
  nodeLabel: '',
  sourceId: '',
  targetId: '',
  edgeWeight: 1,
})

onMounted(() => {
  cy.value = cytoscape({
    container: document.getElementById('cyt'),
    elements: [],
    style: [
      {
        selector: 'node',
        style: {
          label: 'data(label)',
          'background-color': 'data(color)',
          color: '#fff',
          'text-valign': 'center',
          'text-halign': 'center',
          width: 50,
          height: 50,
        },
      },
      {
        selector: 'edge',
        style: {
          label: 'data(weight)',
          width: 3,
          'line-color': '#888',
          'target-arrow-color': '#888',
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier',
        },
      },
      {
        selector: '.highlight',
        style: {
          'background-color': '#00e676',
          'line-color': '#00e676',
          'target-arrow-color': '#00e676',
          'transition-property': 'background-color, line-color, target-arrow-color',
          'transition-duration': '0.5s',
        },
      },
    ],
    layout: {
      name: 'cose',
      animate: true,
    },
  })

cy.value.on('tap', (event) => {
  const target = event.target;

  // Clique em um NÓ
  if (target !== cy.value && typeof target.isNode === 'function' && target.isNode()) {
    const nodeId = target.id();

    if (!selectedNodes.value.includes(nodeId)) {
      target.addClass('selected');
      selectedNodes.value.push(nodeId);
    }

    if (selectedNodes.value.length === 2) {
      const [source, targetId] = selectedNodes.value;
      const edgeId = source + '-' + targetId;

      if (!cy.value.getElementById(edgeId).length) {
        cy.value.add({
          group: 'edges',
          data: { id: edgeId, source, target: targetId, weight: 1 },
        });
      }

      selectedNodes.value.forEach(id => {
        cy.value.getElementById(id).removeClass('selected');
      });

      selectedNodes.value = [];
    }

  // Clique no plano de fundo (não é nó nem aresta)
  } else if (target === cy.value) {
    const pos = event.position || event.renderedPosition;

    // Gera um ID único (opcionalmente usando timestamp)
    const newId = 'n' + Date.now();

    cy.value.add({
      group: 'nodes',
      data: { id: newId, label: newId },
      position: { x: pos.x, y: pos.y }
    });
  }
});


})

function submit() {
  const hasNode = graphData.nodeId && graphData.nodeLabel && !cy.value.getElementById(graphData.nodeId).length
  const hasEdge = graphData.sourceId && graphData.targetId &&
    !cy.value.getElementById([graphData.sourceId, graphData.targetId].sort().join('-')).length

  if (hasNode) {
    cy.value.add({
      group: 'nodes',
      data: {
        id: graphData.nodeId,
        label: graphData.nodeLabel,
        color: '#7B61FF',
      },
    })

    listGraph.value.push({
      nodeId: graphData.nodeId,
      nodeLabel: graphData.nodeLabel,
    })
  }

  if (hasEdge) {
    const edgeId = [graphData.sourceId, graphData.targetId].sort().join('-')
    cy.value.add({
      group: 'edges',
      data: {
        id: edgeId,
        source: graphData.sourceId,
        target: graphData.targetId,
        weight: graphData.edgeWeight,
      },
    })
  }

  cy.value.layout({ name: 'cose', animate: true }).run()

  Object.assign(graphData, {
    nodeId: '',
    nodeLabel: '',
    sourceId: '',
    targetId: '',
    edgeWeight: 1,
  })
}

function encontrarMelhorRota(inicio, destino) {
  if (!cy.value.getElementById(inicio).length || !cy.value.getElementById(destino).length) {
    toast.error('Nó inicial ou destino inválido.')
    return
  }

  const dijkstra = cy.value.elements().dijkstra(`#${inicio}`, edge => edge.data('weight'))
  const path = dijkstra.pathTo(cy.value.getElementById(destino))

  cy.value.elements().removeClass('highlight')
  path.addClass('highlight')

  console.log('Caminho mais curto:', path.map(e => e.id()))
  console.log('Custo total:', dijkstra.distanceTo(cy.value.getElementById(destino)))
}
</script>
