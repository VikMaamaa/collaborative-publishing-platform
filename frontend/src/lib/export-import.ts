import { Post, Organization, User } from '@/types';

export interface ExportOptions {
  format: 'json' | 'csv' | 'markdown';
  includeMetadata?: boolean;
  dateFormat?: string;
}

export interface ImportOptions {
  format: 'json' | 'csv' | 'markdown';
  validateData?: boolean;
  onProgress?: (progress: number) => void;
}

// Export functions
export const exportPosts = (posts: Post[], options: ExportOptions = { format: 'json' }) => {
  const { format, includeMetadata = true, dateFormat = 'YYYY-MM-DD' } = options;

  switch (format) {
    case 'json':
      return exportPostsAsJSON(posts, includeMetadata);
    case 'csv':
      return exportPostsAsCSV(posts, includeMetadata);
    case 'markdown':
      return exportPostsAsMarkdown(posts, includeMetadata);
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
};

export const exportOrganizations = (organizations: Organization[], options: ExportOptions = { format: 'json' }) => {
  const { format, includeMetadata = true } = options;

  switch (format) {
    case 'json':
      return exportOrganizationsAsJSON(organizations, includeMetadata);
    case 'csv':
      return exportOrganizationsAsCSV(organizations, includeMetadata);
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
};

// JSON Export
const exportPostsAsJSON = (posts: Post[], includeMetadata: boolean) => {
  const data = includeMetadata
    ? {
        metadata: {
          exportedAt: new Date().toISOString(),
          totalPosts: posts.length,
          version: '1.0',
        },
        posts: posts.map(post => ({
          id: post.id,
          title: post.title,
          content: post.content,
          excerpt: post.excerpt,
          status: post.status,
          author: post.author,
          organization: post.organization,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
        })),
      }
    : posts;

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  return blob;
};

const exportOrganizationsAsJSON = (organizations: Organization[], includeMetadata: boolean) => {
  const data = includeMetadata
    ? {
        metadata: {
          exportedAt: new Date().toISOString(),
          totalOrganizations: organizations.length,
          version: '1.0',
        },
        organizations: organizations.map(org => ({
          id: org.id,
          name: org.name,
          description: org.description,
          createdAt: org.createdAt,
          updatedAt: org.updatedAt,
        })),
      }
    : organizations;

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  return blob;
};

// CSV Export
const exportPostsAsCSV = (posts: Post[], includeMetadata: boolean) => {
  const headers = ['Title', 'Content', 'Excerpt', 'Status', 'Author', 'Organization', 'Created At', 'Updated At'];
  const rows = posts.map(post => [
    `"${post.title}"`,
    `"${post.content?.replace(/"/g, '""') || ''}"`,
    `"${post.excerpt?.replace(/"/g, '""') || ''}"`,
    post.status,
    `"${post.author?.firstName} ${post.author?.lastName}"`,
    `"${post.organization?.name}"`,
    new Date(post.createdAt).toISOString(),
    new Date(post.updatedAt).toISOString(),
  ]);

  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  return blob;
};

const exportOrganizationsAsCSV = (organizations: Organization[], includeMetadata: boolean) => {
  const headers = ['Name', 'Description', 'Created At', 'Updated At'];
  const rows = organizations.map(org => [
    `"${org.name}"`,
    `"${org.description?.replace(/"/g, '""') || ''}"`,
    new Date(org.createdAt).toISOString(),
    new Date(org.updatedAt).toISOString(),
  ]);

  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  return blob;
};

// Markdown Export
const exportPostsAsMarkdown = (posts: Post[], includeMetadata: boolean) => {
  let markdown = '';

  if (includeMetadata) {
    markdown += `# Posts Export\n\n`;
    markdown += `**Exported:** ${new Date().toLocaleString()}\n`;
    markdown += `**Total Posts:** ${posts.length}\n\n`;
    markdown += `---\n\n`;
  }

  posts.forEach((post, index) => {
    markdown += `## ${post.title}\n\n`;
    markdown += `**Status:** ${post.status}\n`;
    markdown += `**Author:** ${post.author?.firstName} ${post.author?.lastName}\n`;
    markdown += `**Organization:** ${post.organization?.name}\n`;
    markdown += `**Created:** ${new Date(post.createdAt).toLocaleDateString()}\n\n`;

    if (post.excerpt) {
      markdown += `> ${post.excerpt}\n\n`;
    }

    markdown += `${post.content}\n\n`;
    markdown += `---\n\n`;
  });

  const blob = new Blob([markdown], { type: 'text/markdown' });
  return blob;
};

// Import functions
export const importPosts = async (file: File, options: ImportOptions = { format: 'json' }) => {
  const { format, validateData = true, onProgress } = options;

  try {
    const content = await file.text();
    let posts: Post[] = [];

    switch (format) {
      case 'json':
        posts = await importPostsFromJSON(content, validateData);
        break;
      case 'csv':
        posts = await importPostsFromCSV(content, validateData);
        break;
      case 'markdown':
        posts = await importPostsFromMarkdown(content, validateData);
        break;
      default:
        throw new Error(`Unsupported import format: ${format}`);
    }

    if (onProgress) {
      onProgress(100);
    }

    return posts;
  } catch (error) {
    throw new Error(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const importOrganizations = async (file: File, options: ImportOptions = { format: 'json' }) => {
  const { format, validateData = true, onProgress } = options;

  try {
    const content = await file.text();
    let organizations: Organization[] = [];

    switch (format) {
      case 'json':
        organizations = await importOrganizationsFromJSON(content, validateData);
        break;
      case 'csv':
        organizations = await importOrganizationsFromCSV(content, validateData);
        break;
      default:
        throw new Error(`Unsupported import format: ${format}`);
    }

    if (onProgress) {
      onProgress(100);
    }

    return organizations;
  } catch (error) {
    throw new Error(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// JSON Import
const importPostsFromJSON = async (content: string, validateData: boolean): Promise<Post[]> => {
  const data = JSON.parse(content);
  const posts = data.posts || data;

  if (validateData) {
    posts.forEach((post: any, index: number) => {
      if (!post.title || !post.content) {
        throw new Error(`Invalid post at index ${index}: missing required fields`);
      }
    });
  }

  return posts;
};

const importOrganizationsFromJSON = async (content: string, validateData: boolean): Promise<Organization[]> => {
  const data = JSON.parse(content);
  const organizations = data.organizations || data;

  if (validateData) {
    organizations.forEach((org: any, index: number) => {
      if (!org.name) {
        throw new Error(`Invalid organization at index ${index}: missing name`);
      }
    });
  }

  return organizations;
};

// CSV Import
const importPostsFromCSV = async (content: string, validateData: boolean): Promise<Post[]> => {
  const lines = content.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const posts: Post[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    const post: any = {};

    headers.forEach((header, index) => {
      post[header.toLowerCase().replace(/\s+/g, '_')] = values[index];
    });

    if (validateData && (!post.title || !post.content)) {
      throw new Error(`Invalid post at line ${i + 1}: missing required fields`);
    }

    posts.push(post as Post);
  }

  return posts;
};

const importOrganizationsFromCSV = async (content: string, validateData: boolean): Promise<Organization[]> => {
  const lines = content.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const organizations: Organization[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    const org: any = {};

    headers.forEach((header, index) => {
      org[header.toLowerCase().replace(/\s+/g, '_')] = values[index];
    });

    if (validateData && !org.name) {
      throw new Error(`Invalid organization at line ${i + 1}: missing name`);
    }

    organizations.push(org as Organization);
  }

  return organizations;
};

// Markdown Import
const importPostsFromMarkdown = async (content: string, validateData: boolean): Promise<Post[]> => {
  const sections = content.split(/\n##\s+/).filter(section => section.trim());
  const posts: Post[] = [];

  sections.forEach((section, index) => {
    const lines = section.split('\n');
    const title = lines[0].trim();
    
    if (!title) return;

    const post: any = {
      title,
      content: '',
      status: 'draft',
    };

    let inContent = false;
    let contentLines: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('**Status:**')) {
        post.status = line.replace('**Status:**', '').trim();
      } else if (line.startsWith('**Author:**')) {
        const author = line.replace('**Author:**', '').trim();
        post.author = { firstName: author.split(' ')[0], lastName: author.split(' ').slice(1).join(' ') };
      } else if (line.startsWith('**Organization:**')) {
        const org = line.replace('**Organization:**', '').trim();
        post.organization = { name: org };
      } else if (line.startsWith('>')) {
        post.excerpt = line.replace('>', '').trim();
      } else if (line === '---') {
        break;
      } else if (line && !line.startsWith('**')) {
        contentLines.push(line);
      }
    }

    post.content = contentLines.join('\n');

    if (validateData && (!post.title || !post.content)) {
      throw new Error(`Invalid post at section ${index + 1}: missing required fields`);
    }

    posts.push(post as Post);
  });

  return posts;
};

// Utility functions
export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const getFileExtension = (format: string) => {
  switch (format) {
    case 'json':
      return '.json';
    case 'csv':
      return '.csv';
    case 'markdown':
      return '.md';
    default:
      return '.txt';
  }
}; 