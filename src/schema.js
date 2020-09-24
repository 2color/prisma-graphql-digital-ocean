const { gql } = require('apollo-server')
const { prisma } = require('./db')

const typeDefs = gql`
  type User {
    email: String!
    id: ID!
    name: String
    posts: [Post!]!
  }

  type Post {
    author: User
    content: String
    id: ID!
    published: Boolean!
    title: String!
  }

  type Query {
    feed: [Post!]!
    filterPosts(searchString: String): [Post!]!
    post(where: PostWhereUniqueInput!): Post
  }

  type Mutation {
    createUser(data: UserCreateInput!): User!
    createDraft(authorEmail: String, content: String, title: String!): Post!
    deleteOnePost(where: PostWhereUniqueInput!): Post
    publish(id: ID): Post
  }

  input PostWhereUniqueInput {
    id: ID
  }

  input UserCreateInput {
    email: String!
    name: String
    posts: [PostCreateWithoutAuthorInput!]
  }

  input PostCreateWithoutAuthorInput {
    content: String
    published: Boolean
    title: String!
  }
`

const resolvers = {
  Query: {
    feed: (parent, args) => {
      return prisma.post.findMany({
        where: { published: true },
      })
    },
    filterPosts: (parent, args) => {
      return prisma.post.findMany({
        where: {
          OR: [
            { title: { contains: args.searchString } },
            { content: { contains: args.searchString } },
          ],
        },
      })
    },
    post: (parent, args) => {
      return prisma.post.findOne({
        where: { id: Number(args.where.id) },
      })
    },
  },
  Mutation: {
    createDraft: (parent, args) => {
      return prisma.post.create({
        data: {
          title: args.title,
          content: args.content,
          published: false,
          author: {
            connect: { email: args.authorEmail },
          },
        },
      })
    },
    deleteOnePost: (parent, args) => {
      return prisma.post.delete({
        where: { id: Number(args.where.id) },
      })
    },
    publish: (parent, args) => {
      return prisma.post.update({
        where: { id: Number(args.id) },
        data: { published: true },
      })
    },
    createUser: (parent, args) => {
      console.log(args.data.posts)
      return prisma.user.create({
        data: {
          email: args.data.email,
          name: args.data.name,
          posts: {
            create: args.data.posts,
          },
        },
      })
    },
  },
  User: {
    posts: (parent, args) => {
      return prisma.user
        .findOne({
          where: { id: parent.id },
        })
        .posts()
    },
  },
  Post: {
    author: (parent, args) => {
      return prisma.post
        .findOne({
          where: { id: parent.id },
        })
        .author()
    },
  },
}

module.exports = {
  resolvers,
  typeDefs,
}
