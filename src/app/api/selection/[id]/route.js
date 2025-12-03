import dbConnect from '@/lib/db';
import SelectionProject from '@/models/SelectionProject';


export async function GET(req, { params }) {
    try {
        await dbConnect();
        const project = await SelectionProject.findById(params.id);
        if (!project) {
            return Response.json({ message: 'Project not found' }, { status: 404 });
        }
        return Response.json(project);
    } catch (error) {
        return Response.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(req, { params }) {
    try {
        await dbConnect();
        const body = await req.json();
        const { photoId, action, comment, status } = body;
        // action: 'toggle-like', 'comment'
        // OR update status

        const project = await SelectionProject.findById(params.id);
        if (!project) {
            return Response.json({ message: 'Project not found' }, { status: 404 });
        }

        if (status) {
            project.status = status;
        }

        if (photoId) {
            const photo = project.photos.id(photoId);
            if (photo) {
                if (action === 'toggle-like') {
                    photo.selected = !photo.selected;
                }
                if (action === 'comment') {
                    photo.comment = comment;
                }
            }
        }

        await project.save();
        return Response.json({ success: true, project });

    } catch (error) {
        console.error('Update error:', error);
        return Response.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        await dbConnect();
        const project = await SelectionProject.findByIdAndDelete(params.id);
        if (!project) {
            return Response.json({ message: 'Project not found' }, { status: 404 });
        }
        return Response.json({ success: true, message: 'Project deleted successfully' });
    } catch (error) {
        console.error('Delete error:', error);
        return Response.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
