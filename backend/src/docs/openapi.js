module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'Wattpad-like API',
    version: '1.0.0',
    description: 'Backend API for a Wattpad-like story platform with MySQL database',
  },
  servers: [
    {
      url: 'http://localhost:4000',
      description: 'Development server'
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          username: { type: 'string' },
          email: { type: 'string' },
          bio: { type: 'string', nullable: true },
          avatar_url: { type: 'string', nullable: true },
          created_at: { type: 'string', format: 'date-time' }
        }
      },
      Story: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          user_id: { type: 'integer' },
          title: { type: 'string' },
          description: { type: 'string', nullable: true },
          cover_url: { type: 'string', nullable: true },
          status: { type: 'string', enum: ['draft', 'published'] },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' }
        }
      },
      Chapter: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          story_id: { type: 'integer' },
          title: { type: 'string' },
          content: { type: 'string' },
          chapter_order: { type: 'integer' },
          is_published: { type: 'boolean' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' }
        }
      },
      Comment: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          story_id: { type: 'integer' },
          chapter_id: { type: 'integer' },
          user_id: { type: 'integer' },
          content: { type: 'string' },
          parent_comment_id: { type: 'integer', nullable: true },
          created_at: { type: 'string', format: 'date-time' }
        }
      },
      Review: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          story_id: { type: 'integer' },
          user_id: { type: 'integer' },
          rating: { type: 'integer', minimum: 1, maximum: 5 },
          title: { type: 'string', nullable: true },
          content: { type: 'string', nullable: true },
          is_recommended: { type: 'boolean' },
          created_at: { type: 'string', format: 'date-time' }
        }
      },
      Tag: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' }
        }
      },
      FavoriteList: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          user_id: { type: 'integer' },
          name: { type: 'string' },
          is_private: { type: 'boolean' },
          created_at: { type: 'string', format: 'date-time' }
        }
      },
      ReadingHistory: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          user_id: { type: 'integer' },
          story_id: { type: 'integer' },
          last_chapter_id: { type: 'integer' },
          updated_at: { type: 'string', format: 'date-time' }
        }
      },
      Vote: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          chapter_id: { type: 'integer' },
          user_id: { type: 'integer' },
          created_at: { type: 'string', format: 'date-time' }
        }
      },
      Error: {
        type: 'object',
        properties: {
          ok: { type: 'boolean', example: false },
          message: { type: 'string' },
          errorCode: { type: 'string' }
        }
      },
      Success: {
        type: 'object',
        properties: {
          ok: { type: 'boolean', example: true },
          data: { type: 'object' },
          message: { type: 'string' }
        }
      }
    }
  },
  paths: {
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Health check',
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean', example: true }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'email', 'password'],
                properties: {
                  username: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'User registered',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Success' }
              }
            }
          }
        }
      }
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string' },
                  password: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        user: { $ref: '#/components/schemas/User' },
                        access: { type: 'string', description: 'JWT token (2h expiry)' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current user',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'User profile',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/User' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/stories': {
      get: {
        tags: ['Stories'],
        summary: 'List published stories',
        parameters: [
          { name: 'q', in: 'query', schema: { type: 'string' } },
          { name: 'tag', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'size', in: 'query', schema: { type: 'integer', default: 12 } }
        ],
        responses: {
          '200': { description: 'Stories list' }
        }
      },
      post: {
        tags: ['Stories'],
        summary: 'Create story',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title'],
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  cover_url: { type: 'string' },
                  tags: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        },
        responses: {
          '201': { description: 'Story created' }
        }
      }
    },
    '/upload/image': {
      post: {
        tags: ['Upload'],
        summary: 'Upload image to Cloudinary',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file: { type: 'string', format: 'binary' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Image uploaded',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        url: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
