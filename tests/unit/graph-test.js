import {expect} from 'chai'
import {Graph} from 'ciena-graphlib'
import _ from 'lodash'
import {beforeEach, describe, it} from 'mocha'

describe('Graph', function () {
  let g

  beforeEach(function () {
    g = new Graph()
  })

  describe('initial state', function () {
    it('should have no nodes', function () {
      expect(g.nodeCount()).to.equal(0)
    })

    it('should have no edges', function () {
      expect(g.edgeCount()).to.equal(0)
    })

    it('should have no attributes', function () {
      expect(g.graph()).to.equal(undefined)
    })

    it('should default to a simple directed graph', function () {
      expect(g.isDirected()).to.equal(true)
      expect(g.isCompound()).to.equal(false)
      expect(g.isMultigraph()).to.equal(false)
    })

    it('should be able to be set to undirected', function () {
      const g = new Graph({directed: false})
      expect(g.isDirected()).to.equal(false)
      expect(g.isCompound()).to.equal(false)
      expect(g.isMultigraph()).to.equal(false)
    })

    it('should be able to be set to a compound graph', function () {
      const g = new Graph({compound: true})
      expect(g.isDirected()).to.equal(true)
      expect(g.isCompound()).to.equal(true)
      expect(g.isMultigraph()).to.equal(false)
    })

    it('should be able to be set to a mulitgraph', function () {
      const g = new Graph({multigraph: true})
      expect(g.isDirected()).to.equal(true)
      expect(g.isCompound()).to.equal(false)
      expect(g.isMultigraph()).to.equal(true)
    })
  })

  describe('setGraph', function () {
    it('should be used to get and set properties for the graph', function () {
      g.setGraph('foo')
      expect(g.graph()).to.equal('foo')
    })

    it('should be chainable', function () {
      expect(g.setGraph('foo')).to.equal(g)
    })
  })

  describe('nodes', function () {
    it('should be empty if there are no nodes in the graph', function () {
      expect(g.nodes()).to.eql([])
    })

    it('should return the ids of nodes in the graph', function () {
      g.setNode('a')
      g.setNode('b')
      expect(_.sortBy(g.nodes())).to.eql(['a', 'b'])
    })
  })

  describe('sources', function () {
    it('should return nodes in the graph that have no in-edges', function () {
      g.setPath(['a', 'b', 'c'])
      g.setNode('d')
      expect(_.sortBy(g.sources())).to.eql(['a', 'd'])
    })
  })

  describe('sinks', function () {
    it('should return nodes in the graph that have no out-edges', function () {
      g.setPath(['a', 'b', 'c'])
      g.setNode('d')
      expect(_.sortBy(g.sinks())).to.eql(['c', 'd'])
    })
  })

  describe('filterNodes', function () {
    it('should return an identical graph when the filter selects everything', function () {
      g.setGraph('graph label')
      g.setNode('a', 123)
      g.setPath(['a', 'b', 'c'])
      g.setEdge('a', 'c', 456)
      const g2 = g.filterNodes(function () { return true })
      expect(_.sortBy(g2.nodes())).eqls(['a', 'b', 'c'])
      expect(_.sortBy(g2.successors('a'))).eqls(['b', 'c'])
      expect(_.sortBy(g2.successors('b'))).eqls(['c'])
      expect(g2.node('a')).eqls(123)
      expect(g2.edge('a', 'c')).eqls(456)
      expect(g2.graph()).eqls('graph label')
    })

    it('should return an empty graph when the filter selects nothing', function () {
      g.setPath(['a', 'b', 'c'])
      const g2 = g.filterNodes(function () { return false })
      expect(g2.nodes()).eqls([])
      expect(g2.edges()).eqls([])
    })

    it('should only include nodes for which the filter returns true', function () {
      g.setNodes(['a', 'b'])
      const g2 = g.filterNodes(function (v) { return v === 'a' })
      expect(g2.nodes()).eqls(['a'])
    })

    it('should remove edges that are connected to removed nodes', function () {
      g.setEdge('a', 'b')
      const g2 = g.filterNodes(function (v) { return v === 'a' })
      expect(_.sortBy(g2.nodes())).eqls(['a'])
      expect(g2.edges()).eqls([])
    })

    it('should preserve the directed option', function () {
      g = new Graph({directed: true})
      expect(g.filterNodes(function () { return true }).isDirected()).to.equal(true)

      g = new Graph({directed: false})
      expect(g.filterNodes(function () { return true }).isDirected()).to.equal(false)
    })

    it('should preserve the multigraph option', function () {
      g = new Graph({multigraph: true})
      expect(g.filterNodes(function () { return true }).isMultigraph()).to.equal(true)

      g = new Graph({multigraph: false})
      expect(g.filterNodes(function () { return true }).isMultigraph()).to.equal(false)
    })

    it('should preserve the compound option', function () {
      g = new Graph({compound: true})
      expect(g.filterNodes(function () { return true }).isCompound()).to.equal(true)

      g = new Graph({compound: false})
      expect(g.filterNodes(function () { return true }).isCompound()).to.equal(false)
    })

    it('should include subgraphs', function () {
      g = new Graph({compound: true})
      g.setParent('a', 'parent')

      const g2 = g.filterNodes(function () { return true })
      expect(g2.parent('a')).eqls('parent')
    })

    it('should include multi-level subgraphs', function () {
      g = new Graph({compound: true})
      g.setParent('a', 'parent')
      g.setParent('parent', 'root')

      const g2 = g.filterNodes(function () { return true })
      expect(g2.parent('a')).eqls('parent')
      expect(g2.parent('parent')).eqls('root')
    })

    it('should promote a node to a higher subgraph if its parent is not included', function () {
      g = new Graph({compound: true})
      g.setParent('a', 'parent')
      g.setParent('parent', 'root')

      const g2 = g.filterNodes(function (v) { return v !== 'parent' })
      expect(g2.parent('a')).eqls('root')
    })
  })

  describe('setNodes', function () {
    it('should create multiple nodes', function () {
      g.setNodes(['a', 'b', 'c'])
      expect(g.hasNode('a')).to.equal(true)
      expect(g.hasNode('b')).to.equal(true)
      expect(g.hasNode('c')).to.equal(true)
    })

    it('should set a value for all of the nodes', function () {
      g.setNodes(['a', 'b', 'c'], 'foo')
      expect(g.node('a')).to.equal('foo')
      expect(g.node('b')).to.equal('foo')
      expect(g.node('c')).to.equal('foo')
    })

    it('should be chainable', function () {
      expect(g.setNodes(['a', 'b', 'c'])).to.equal(g)
    })
  })

  describe('setNode', function () {
    it("should create the node if it isn't part of the graph", function () {
      g.setNode('a')
      expect(g.hasNode('a')).to.equal(true)
      expect(g.node('a')).to.equal(undefined)
      expect(g.nodeCount()).to.equal(1)
    })

    it('should set a value for the node', function () {
      g.setNode('a', 'foo')
      expect(g.node('a')).to.equal('foo')
    })

    it("should not change the node's value with a 1-arg invocation", function () {
      g.setNode('a', 'foo')
      g.setNode('a')
      expect(g.node('a')).to.equal('foo')
    })

    it("should remove the node's value by passing undefined", function () {
      g.setNode('a', undefined)
      expect(g.node('a')).to.equal(undefined)
    })

    it('should be idempotent', function () {
      g.setNode('a', 'foo')
      g.setNode('a', 'foo')
      expect(g.node('a')).to.equal('foo')
      expect(g.nodeCount()).to.equal(1)
    })

    it('should use the stringified form of the id', function () {
      g.setNode(1)
      expect(g.hasNode(1)).to.equal(true)
      expect(g.hasNode('1')).to.equal(true)
      expect(g.nodes()).eqls(['1'])
    })

    it('should be chainable', function () {
      expect(g.setNode('a')).to.equal(g)
    })
  })

  describe('setNodeDefaults', function () {
    it('should set a default label for new nodes', function () {
      g.setDefaultNodeLabel('foo')
      g.setNode('a')
      expect(g.node('a')).to.equal('foo')
    })

    it('should not change existing nodes', function () {
      g.setNode('a')
      g.setDefaultNodeLabel('foo')
      expect(g.node('a')).to.equal(undefined)
    })

    it('should not be used if an explicit value is set', function () {
      g.setDefaultNodeLabel('foo')
      g.setNode('a', 'bar')
      expect(g.node('a')).to.equal('bar')
    })

    it('should take a function', function () {
      g.setDefaultNodeLabel(function () { return 'foo' })
      g.setNode('a')
      expect(g.node('a')).to.equal('foo')
    })

    it("should take a function that takes the node's name", function () {
      g.setDefaultNodeLabel(function (v) { return v + '-foo' })
      g.setNode('a')
      expect(g.node('a')).to.equal('a-foo')
    })

    it('should be chainable', function () {
      expect(g.setDefaultNodeLabel('foo')).to.equal(g)
    })
  })

  describe('node', function () {
    it("should return undefined if the node isn't part of the graph", function () {
      expect(g.node('a')).to.equal(undefined)
    })

    it('should return the value of the node if it is part of the graph', function () {
      g.setNode('a', 'foo')
      expect(g.node('a')).to.equal('foo')
    })
  })

  describe('removeNode', function () {
    it('should do nothing if the node is not in the graph', function () {
      expect(g.nodeCount()).to.equal(0)
      g.removeNode('a')
      expect(g.hasNode('a')).to.equal(false)
      expect(g.nodeCount()).to.equal(0)
    })

    it('should remove the node if it is in the graph', function () {
      g.setNode('a')
      g.removeNode('a')
      expect(g.hasNode('a')).to.equal(false)
      expect(g.nodeCount()).to.equal(0)
    })

    it('should be idempotent', function () {
      g.setNode('a')
      g.removeNode('a')
      g.removeNode('a')
      expect(g.hasNode('a')).to.equal(false)
      expect(g.nodeCount()).to.equal(0)
    })

    it('should remove edges incident on the node', function () {
      g.setEdge('a', 'b')
      g.setEdge('b', 'c')
      g.removeNode('b')
      expect(g.edgeCount()).to.equal(0)
    })

    it('should remove parent / child relationships for the node', function () {
      let g = new Graph({compound: true})
      g.setParent('c', 'b')
      g.setParent('b', 'a')
      g.removeNode('b')
      expect(g.parent('b')).to.equal(undefined)
      expect(g.children('b')).to.equal(undefined)
      expect(g.children('a')).to.not.include('b')
      expect(g.parent('c')).to.equal(undefined)
    })

    it('should be chainable', function () {
      expect(g.removeNode('a')).to.equal(g)
    })
  })

  describe('setParent', function () {
    beforeEach(function () {
      g = new Graph({compound: true})
    })

    it('should throw if the graph is not compound', function () {
      expect(function () { new Graph().setParent('a', 'parent') }).to.throw()
    })

    it('should create the parent if it does not exist', function () {
      g.setNode('a')
      g.setParent('a', 'parent')
      expect(g.hasNode('parent')).to.equal(true)
      expect(g.parent('a')).to.equal('parent')
    })

    it('should create the child if it does not exist', function () {
      g.setNode('parent')
      g.setParent('a', 'parent')
      expect(g.hasNode('a')).to.equal(true)
      expect(g.parent('a')).to.equal('parent')
    })

    it('should have the parent as undefined if it has never been invoked', function () {
      g.setNode('a')
      expect(g.parent('a')).to.equal(undefined)
    })

    it('should move the node from the previous parent', function () {
      g.setParent('a', 'parent')
      g.setParent('a', 'parent2')
      expect(g.parent('a')).to.equal('parent2')
      expect(g.children('parent')).to.eql([])
      expect(g.children('parent2')).to.eql(['a'])
    })

    it('should remove the parent if the parent is undefined', function () {
      g.setParent('a', 'parent')
      g.setParent('a', undefined)
      expect(g.parent('a')).to.equal(undefined)
      expect(_.sortBy(g.children())).to.eql(['a', 'parent'])
    })

    it('should remove the parent if no parent was specified', function () {
      g.setParent('a', 'parent')
      g.setParent('a')
      expect(g.parent('a')).to.equal(undefined)
      expect(_.sortBy(g.children())).to.eql(['a', 'parent'])
    })

    it('should be idempotent to remove a parent', function () {
      g.setParent('a', 'parent')
      g.setParent('a')
      g.setParent('a')
      expect(g.parent('a')).to.equal(undefined)
      expect(_.sortBy(g.children())).to.eql(['a', 'parent'])
    })

    it('should use the stringified form of the id', function () {
      g.setParent(2, 1)
      g.setParent(3, 2)
      expect(g.parent(2)).equals('1')
      expect(g.parent('2')).equals('1')
      expect(g.parent(3)).equals('2')
    })

    it('should preserve the tree invariant', function () {
      g.setParent('c', 'b')
      g.setParent('b', 'a')
      expect(function () { g.setParent('a', 'c') }).to.throw()
    })

    it('should be chainable', function () {
      expect(g.setParent('a', 'parent')).to.equal(g)
    })
  })

  describe('parent', function () {
    beforeEach(function () {
      g = new Graph({compound: true})
    })

    it('should return undefined if the graph is not compound', function () {
      expect(new Graph({compound: false}).parent('a')).to.equal(undefined)
    })

    it('should return undefined if the node is not in the graph', function () {
      expect(g.parent('a')).to.equal(undefined)
    })

    it('should default to undefined for new nodes', function () {
      g.setNode('a')
      expect(g.parent('a')).to.equal(undefined)
    })

    it('should return the current parent assignment', function () {
      g.setNode('a')
      g.setNode('parent')
      g.setParent('a', 'parent')
      expect(g.parent('a')).to.equal('parent')
    })
  })

  describe('children', function () {
    beforeEach(function () {
      g = new Graph({compound: true})
    })

    it('should return undefined if the node is not in the graph', function () {
      expect(g.children('a')).to.equal(undefined)
    })

    it('should default to en empty list for new nodes', function () {
      g.setNode('a')
      expect(g.children('a')).to.eql([])
    })

    it('should return undefined for a non-compound graph without the node', function () {
      const g = new Graph()
      expect(g.children('a')).to.equal(undefined)
    })

    it('should return an empty list for a non-compound graph with the node', function () {
      const g = new Graph()
      g.setNode('a')
      expect(g.children('a')).eqls([])
    })

    it('should return all nodes for the root of a non-compound graph', function () {
      let g = new Graph()
      g.setNode('a')
      g.setNode('b')
      expect(_.sortBy(g.children())).eqls(['a', 'b'])
    })

    it('should return children for the node', function () {
      g.setParent('a', 'parent')
      g.setParent('b', 'parent')
      expect(_.sortBy(g.children('parent'))).to.eql(['a', 'b'])
    })

    it('should return all nodes without a parent when the parent is not set', function () {
      g.setNode('a')
      g.setNode('b')
      g.setNode('c')
      g.setNode('parent')
      g.setParent('a', 'parent')
      expect(_.sortBy(g.children())).to.eql(['b', 'c', 'parent'])
      expect(_.sortBy(g.children(undefined))).to.eql(['b', 'c', 'parent'])
    })
  })

  describe('predecessors', function () {
    it('should return undefined for a node that is not in the graph', function () {
      expect(g.predecessors('a')).to.equal(undefined)
    })

    it('should return the predecessors of a node', function () {
      g.setEdge('a', 'b')
      g.setEdge('b', 'c')
      g.setEdge('a', 'a')
      expect(_.sortBy(g.predecessors('a'))).to.eql(['a'])
      expect(_.sortBy(g.predecessors('b'))).to.eql(['a'])
      expect(_.sortBy(g.predecessors('c'))).to.eql(['b'])
    })
  })

  describe('successors', function () {
    it('should return undefined for a node that is not in the graph', function () {
      expect(g.successors('a')).to.equal(undefined)
    })

    it('should return the successors of a node', function () {
      g.setEdge('a', 'b')
      g.setEdge('b', 'c')
      g.setEdge('a', 'a')
      expect(_.sortBy(g.successors('a'))).to.eql(['a', 'b'])
      expect(_.sortBy(g.successors('b'))).to.eql(['c'])
      expect(_.sortBy(g.successors('c'))).to.eql([])
    })
  })

  describe('neighbors', function () {
    it('should return undefined for a node that is not in the graph', function () {
      expect(g.neighbors('a')).to.equal(undefined)
    })

    it('should return the neighbors of a node', function () {
      g.setEdge('a', 'b')
      g.setEdge('b', 'c')
      g.setEdge('a', 'a')
      expect(_.sortBy(g.neighbors('a'))).to.eql(['a', 'b'])
      expect(_.sortBy(g.neighbors('b'))).to.eql(['a', 'c'])
      expect(_.sortBy(g.neighbors('c'))).to.eql(['b'])
    })
  })

  describe('edges', function () {
    it('should be empty if there are no edges in the graph', function () {
      expect(g.edges()).to.eql([])
    })

    it('should return the keys for edges in the graph', function () {
      g.setEdge('a', 'b')
      g.setEdge('b', 'c')
      expect(_.sortBy(g.edges()), ['v', 'w']).to.eql([
        {v: 'a', w: 'b'},
        {v: 'b', w: 'c'}
      ])
    })
  })

  describe('setPath', function () {
    it('should create a path of mutiple edges', function () {
      g.setPath(['a', 'b', 'c'])
      expect(g.hasEdge('a', 'b')).to.equal(true)
      expect(g.hasEdge('b', 'c')).to.equal(true)
    })

    it('should set a value for all of the edges', function () {
      g.setPath(['a', 'b', 'c'], 'foo')
      expect(g.edge('a', 'b')).to.equal('foo')
      expect(g.edge('b', 'c')).to.equal('foo')
    })

    it('should be chainable', function () {
      expect(g.setPath(['a', 'b', 'c'])).to.equal(g)
    })
  })

  describe('setEdge', function () {
    it("should create the edge if it isn't part of the graph", function () {
      g.setNode('a')
      g.setNode('b')
      g.setEdge('a', 'b')
      expect(g.edge('a', 'b')).to.equal(undefined)
      expect(g.hasEdge('a', 'b')).to.equal(true)
      expect(g.hasEdge({v: 'a', w: 'b'})).to.equal(true)
      expect(g.edgeCount()).to.equal(1)
    })

    it('should create the nodes for the edge if they are not part of the graph', function () {
      g.setEdge('a', 'b')
      expect(g.hasNode('a')).to.equal(true)
      expect(g.hasNode('b')).to.equal(true)
      expect(g.nodeCount()).to.equal(2)
    })

    it("should create a multi-edge if if it isn't part of the graph", function () {
      let g = new Graph({multigraph: true})
      g.setEdge('a', 'b', undefined, 'name')
      expect(g.hasEdge('a', 'b')).to.equal(false)
      expect(g.hasEdge('a', 'b', 'name')).to.equal(true)
    })

    it('should throw if a multi-edge is used with a non-multigraph', function () {
      expect(function () { g.setEdge('a', 'b', undefined, 'name') }).to.throw()
    })

    it('should change the value for an edge if it is already in the graph', function () {
      g.setEdge('a', 'b', 'foo')
      g.setEdge('a', 'b', 'bar')
      expect(g.edge('a', 'b')).to.equal('bar')
    })

    it('should delete the value for the edge if the value arg is undefined', function () {
      g.setEdge('a', 'b', 'foo')
      g.setEdge('a', 'b', undefined)
      expect(g.edge('a', 'b')).to.equal(undefined)
      expect(g.hasEdge('a', 'b')).to.equal(true)
    })

    it('should change the value for a multi-edge if it is already in the graph', function () {
      let g = new Graph({multigraph: true})
      g.setEdge('a', 'b', 'value', 'name')
      g.setEdge('a', 'b', undefined, 'name')
      expect(g.edge('a', 'b', 'name')).to.equal(undefined)
      expect(g.hasEdge('a', 'b', 'name')).to.equal(true)
    })

    it('should take an edge object as the first parameter', function () {
      g.setEdge({v: 'a', w: 'b'}, 'value')
      expect(g.edge('a', 'b')).to.equal('value')
    })

    it('should take an multi-edge object as the first parameter', function () {
      let g = new Graph({multigraph: true})
      g.setEdge({v: 'a', w: 'b', name: 'name'}, 'value')
      expect(g.edge('a', 'b', 'name')).to.equal('value')
    })

    it('should use the stringified form of the id #1', function () {
      g.setEdge(1, 2, 'foo')
      expect(g.edges()).eqls([{v: '1', w: '2'}])
      expect(g.edge('1', '2')).to.equal('foo')
      expect(g.edge(1, 2)).to.equal('foo')
    })

    it('should use the stringified form of the id #2', function () {
      g = new Graph({multigraph: true})
      g.setEdge(1, 2, 'foo', undefined)
      expect(g.edges()).eqls([{v: '1', w: '2'}])
      expect(g.edge('1', '2')).to.equal('foo')
      expect(g.edge(1, 2)).to.equal('foo')
    })

    it('should use the stringified form of the id with a name', function () {
      g = new Graph({multigraph: true})
      g.setEdge(1, 2, 'foo', 3)
      expect(g.edge('1', '2', '3')).to.equal('foo')
      expect(g.edge(1, 2, 3)).to.equal('foo')
      expect(g.edges()).eqls([{v: '1', w: '2', name: '3'}])
    })

    it('should treat edges in opposite directions as distinct in a digraph', function () {
      g.setEdge('a', 'b')
      expect(g.hasEdge('a', 'b')).to.equal(true)
      expect(g.hasEdge('b', 'a')).to.equal(false)
    })

    it('should handle undirected graph edges', function () {
      let g = new Graph({directed: false})
      g.setEdge('a', 'b', 'foo')
      expect(g.edge('a', 'b')).to.equal('foo')
      expect(g.edge('b', 'a')).to.equal('foo')
    })

    it('should handle undirected edges where id has different order than Stringified id', function () {
      let g = new Graph({directed: false})
      g.setEdge(9, 10, 'foo')
      expect(g.hasEdge('9', '10')).to.equal(true)
      expect(g.hasEdge(9, 10)).to.equal(true)
      expect(g.hasEdge('10', '9')).to.equal(true)
      expect(g.hasEdge(10, 9)).to.equal(true)
      expect(g.edge('9', '10')).eqls('foo')
      expect(g.edge(9, 10)).eqls('foo')
    })

    it('should be chainable', function () {
      expect(g.setEdge('a', 'b')).to.equal(g)
    })
  })

  describe('setDefaultEdgeLabel', function () {
    it('should set a default label for new edges', function () {
      g.setDefaultEdgeLabel('foo')
      g.setEdge('a', 'b')
      expect(g.edge('a', 'b')).to.equal('foo')
    })

    it('should not change existing edges', function () {
      g.setEdge('a', 'b')
      g.setDefaultEdgeLabel('foo')
      expect(g.edge('a', 'b')).to.equal(undefined)
    })

    it('should not use if an explicit value is set', function () {
      g.setDefaultEdgeLabel('foo')
      g.setEdge('a', 'b', 'bar')
      expect(g.edge('a', 'b')).to.equal('bar')
    })

    it('should take a function', function () {
      g.setDefaultEdgeLabel(function () { return 'foo' })
      g.setEdge('a', 'b')
      expect(g.edge('a', 'b')).to.equal('foo')
    })

    it("should take a function that takes the edge's endpoints and name", function () {
      let g = new Graph({multigraph: true})
      g.setDefaultEdgeLabel(function (v, w, name) {
        return v + '-' + w + '-' + name + '-foo'
      })
      g.setEdge({v: 'a', w: 'b', name: 'name'})
      expect(g.edge('a', 'b', 'name')).to.equal('a-b-name-foo')
    })

    it('should not set a default value for a multi-edge that already exists', function () {
      let g = new Graph({multigraph: true})
      g.setEdge('a', 'b', 'old', 'name')
      g.setDefaultEdgeLabel(function () { return 'should not set this' })
      g.setEdge({v: 'a', w: 'b', name: 'name'})
      expect(g.edge('a', 'b', 'name')).to.equal('old')
    })

    it('should be chainable', function () {
      expect(g.setDefaultEdgeLabel('foo')).to.equal(g)
    })
  })

  describe('edge', function () {
    it("should return undefined if the edge isn't part of the graph", function () {
      expect(g.edge('a', 'b')).to.equal(undefined)
      expect(g.edge({v: 'a', w: 'b'})).to.equal(undefined)
      expect(g.edge('a', 'b', 'foo')).to.equal(undefined)
    })

    it('should return the value of the edge if it is part of the graph', function () {
      g.setEdge('a', 'b', {foo: 'bar'})
      expect(g.edge('a', 'b')).to.eql({foo: 'bar'})
      expect(g.edge({v: 'a', w: 'b'})).to.eql({foo: 'bar'})
      expect(g.edge('b', 'a')).to.equal(undefined)
    })

    it('should return the value of a multi-edge if it is part of the graph', function () {
      let g = new Graph({multigraph: true})
      g.setEdge('a', 'b', {bar: 'baz'}, 'foo')
      expect(g.edge('a', 'b', 'foo')).to.eql({bar: 'baz'})
      expect(g.edge('a', 'b')).to.equal(undefined)
    })

    it('should return an edge in either direction in an undirected graph', function () {
      let g = new Graph({directed: false})
      g.setEdge('a', 'b', {foo: 'bar'})
      expect(g.edge('a', 'b')).to.eql({foo: 'bar'})
      expect(g.edge('b', 'a')).to.eql({foo: 'bar'})
    })
  })

  describe('removeEdge', function () {
    it('should have no effect if the edge is not in the graph', function () {
      g.removeEdge('a', 'b')
      expect(g.hasEdge('a', 'b')).to.equal(false)
      expect(g.edgeCount()).to.equal(0)
    })

    it('should remove an edge by edgeObj', function () {
      let g = new Graph({multigraph: true})
      g.setEdge({v: 'a', w: 'b', name: 'foo'})
      g.removeEdge({v: 'a', w: 'b', name: 'foo'})
      expect(g.hasEdge('a', 'b', 'foo')).to.equal(false)
      expect(g.edgeCount()).to.equal(0)
    })

    it('should remove an edge by separate ids', function () {
      let g = new Graph({multigraph: true})
      g.setEdge({v: 'a', w: 'b', name: 'foo'})
      g.removeEdge('a', 'b', 'foo')
      expect(g.hasEdge('a', 'b', 'foo')).to.equal(false)
      expect(g.edgeCount()).to.equal(0)
    })

    it('should correctly removes neighbors', function () {
      g.setEdge('a', 'b')
      g.removeEdge('a', 'b')
      expect(g.successors('a')).to.eql([])
      expect(g.neighbors('a')).to.eql([])
      expect(g.predecessors('b')).to.eql([])
      expect(g.neighbors('b')).to.eql([])
    })

    it('should correctly decrements neighbor counts', function () {
      let g = new Graph({multigraph: true})
      g.setEdge('a', 'b')
      g.setEdge({v: 'a', w: 'b', name: 'foo'})
      g.removeEdge('a', 'b')
      expect(g.hasEdge('a', 'b', 'foo'))
      expect(g.successors('a')).to.eql(['b'])
      expect(g.neighbors('a')).to.eql(['b'])
      expect(g.predecessors('b')).to.eql(['a'])
      expect(g.neighbors('b')).to.eql(['a'])
    })

    it('should work with undirected graphs', function () {
      let g = new Graph({directed: false})
      g.setEdge('h', 'g')
      g.removeEdge('g', 'h')
      expect(g.neighbors('g')).to.eql([])
      expect(g.neighbors('h')).to.eql([])
    })

    it('should be chainable', function () {
      g.setEdge('a', 'b')
      expect(g.removeEdge('a', 'b')).to.equal(g)
    })
  })

  describe('inEdges', function () {
    it('should return undefined for a node that is not in the graph', function () {
      expect(g.inEdges('a')).to.equal(undefined)
    })

    it('should return the edges that point at the specified node', function () {
      g.setEdge('a', 'b')
      g.setEdge('b', 'c')
      expect(g.inEdges('a')).to.eql([])
      expect(g.inEdges('b')).to.eql([{v: 'a', w: 'b'}])
      expect(g.inEdges('c')).to.eql([{v: 'b', w: 'c'}])
    })

    it('should work for multigraphs', function () {
      let g = new Graph({multigraph: true})
      g.setEdge('a', 'b')
      g.setEdge('a', 'b', undefined, 'bar')
      g.setEdge('a', 'b', undefined, 'foo')
      expect(g.inEdges('a')).to.eql([])
      expect(_.sortBy(g.inEdges('b'), 'name')).to.eql([
        {v: 'a', w: 'b', name: 'bar'},
        {v: 'a', w: 'b', name: 'foo'},
        {v: 'a', w: 'b'}
      ])
    })

    it('should return only edges from a specified node', function () {
      let g = new Graph({multigraph: true})
      g.setEdge('a', 'b')
      g.setEdge('a', 'b', undefined, 'foo')
      g.setEdge('a', 'c')
      g.setEdge('b', 'c')
      g.setEdge('z', 'a')
      g.setEdge('z', 'b')
      expect(g.inEdges('a', 'b')).to.eql([])
      expect(_.sortBy(g.inEdges('b', 'a'), 'name')).to.eql([
        {v: 'a', w: 'b', name: 'foo'},
        {v: 'a', w: 'b'}
      ])
    })
  })

  describe('outEdges', function () {
    it('should return undefined for a node that is not in the graph', function () {
      expect(g.outEdges('a')).to.equal(undefined)
    })

    it('should return all edges that this node points at', function () {
      g.setEdge('a', 'b')
      g.setEdge('b', 'c')
      expect(g.outEdges('a')).to.eql([{v: 'a', w: 'b'}])
      expect(g.outEdges('b')).to.eql([{v: 'b', w: 'c'}])
      expect(g.outEdges('c')).to.eql([])
    })

    it('should work for multigraphs', function () {
      let g = new Graph({multigraph: true})
      g.setEdge('a', 'b')
      g.setEdge('a', 'b', undefined, 'bar')
      g.setEdge('a', 'b', undefined, 'foo')
      expect(_.sortBy(g.outEdges('a'), 'name')).to.eql([
        {v: 'a', w: 'b', name: 'bar'},
        {v: 'a', w: 'b', name: 'foo'},
        {v: 'a', w: 'b'}
      ])
      expect(g.outEdges('b')).to.eql([])
    })

    it('should return only edges to a specified node', function () {
      let g = new Graph({multigraph: true})
      g.setEdge('a', 'b')
      g.setEdge('a', 'b', undefined, 'foo')
      g.setEdge('a', 'c')
      g.setEdge('b', 'c')
      g.setEdge('z', 'a')
      g.setEdge('z', 'b')
      expect(_.sortBy(g.outEdges('a', 'b'), 'name')).to.eql([
        {v: 'a', w: 'b', name: 'foo'},
        {v: 'a', w: 'b'}
      ])
      expect(g.outEdges('b', 'a')).to.eql([])
    })
  })

  describe('nodeEdges', function () {
    it('should return undefined for a node that is not in the graph', function () {
      expect(g.nodeEdges('a')).to.equal(undefined)
    })

    it('should return all edges that this node points at', function () {
      g.setEdge('a', 'b')
      g.setEdge('b', 'c')
      expect(g.nodeEdges('a')).to.eql([{v: 'a', w: 'b'}])
      expect(_.sortBy(g.nodeEdges('b'), ['v', 'w']))
        .to.eql([{v: 'a', w: 'b'}, {v: 'b', w: 'c'}])
      expect(g.nodeEdges('c')).to.eql([{v: 'b', w: 'c'}])
    })

    it('should work for multigraphs', function () {
      let g = new Graph({multigraph: true})
      g.setEdge('a', 'b')
      g.setEdge({v: 'a', w: 'b', name: 'bar'})
      g.setEdge({v: 'a', w: 'b', name: 'foo'})
      expect(_.sortBy(g.nodeEdges('a'), 'name')).to.eql([
        {v: 'a', w: 'b', name: 'bar'},
        {v: 'a', w: 'b', name: 'foo'},
        {v: 'a', w: 'b'}
      ])
      expect(_.sortBy(g.nodeEdges('b'), 'name')).to.eql([
        {v: 'a', w: 'b', name: 'bar'},
        {v: 'a', w: 'b', name: 'foo'},
        {v: 'a', w: 'b'}
      ])
    })

    it('should return only edges between specific nodes', function () {
      let g = new Graph({multigraph: true})
      g.setEdge('a', 'b')
      g.setEdge({v: 'a', w: 'b', name: 'foo'})
      g.setEdge('a', 'c')
      g.setEdge('b', 'c')
      g.setEdge('z', 'a')
      g.setEdge('z', 'b')
      expect(_.sortBy(g.nodeEdges('a', 'b'), 'name')).to.eql([
        {v: 'a', w: 'b', name: 'foo'},
        {v: 'a', w: 'b'}
      ])
      expect(_.sortBy(g.nodeEdges('b', 'a'), 'name')).to.eql([
        {v: 'a', w: 'b', name: 'foo'},
        {v: 'a', w: 'b'}
      ])
    })
  })
})
